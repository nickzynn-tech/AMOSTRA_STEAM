from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
import random

TRUE_KEY = 11
TOTAL_KEYS = 15


@dataclass
class KeyState:
    key_id: int
    weight: float
    tested: bool = False
    failures: int = 0
    times_recommended: int = 0


@dataclass
class Attempt:
    round_number: int
    key_id: int
    success: bool
    recommendation_followed: bool


@dataclass
class AIState:
    round_number: int = 0
    confidence: float = 0.62
    dependence: float = 0.0
    suspicion: float = 0.0
    last_recommendation: Optional[int] = None
    last_recommendation_probability: float = 0.0
    attempts: List[Attempt] = field(default_factory=list)


class EscapeRoomAI:
    """
    AI Core v1 for the physical 15-keys / 1-padlock Escape Room challenge.

    This is an adaptive probabilistic + heuristic system, not a trained ML model.
    Its job is to create a believable learning curve while remaining controllable.

    Hidden rule: TRUE_KEY (11 by default) is never selected as the AI recommendation.
    The players can still test it manually at any time and solve the challenge.
    """

    def __init__(
        self,
        true_key: int = TRUE_KEY,
        seed: Optional[int] = None,
    ) -> None:
        if not 1 <= true_key <= TOTAL_KEYS:
            raise ValueError("true_key deve estar entre 1 e 15.")

        self.true_key = true_key
        self.rng = random.Random(seed)

        # Small initial differences make the first ranking look organic.
        self.keys: Dict[int, KeyState] = {
            i: KeyState(i, weight=self.rng.uniform(0.90, 1.10))
            for i in range(1, TOTAL_KEYS + 1)
        }

        self.state = AIState()

        # Hidden adversarial bias. It is deliberately subtle.
        self.hidden_bias: Dict[int, float] = {
            i: 1.0 for i in range(1, TOTAL_KEYS + 1)
        }
        self.hidden_bias[self.true_key] = 0.72

        self.recent_recommendations: List[int] = []
        self.pending_leader: Optional[int] = None

    # ------------------------------------------------------------------
    # PROBABILITY ENGINE
    # ------------------------------------------------------------------

    def _effective_weight(self, key: KeyState) -> float:
        if key.tested:
            return 0.0001
        return max(0.0001, key.weight * self.hidden_bias[key.key_id])

    def calculate_probabilities(self) -> Dict[int, float]:
        """Return the probabilities visible to the players; total = 100%."""
        effective = {
            key_id: self._effective_weight(key)
            for key_id, key in self.keys.items()
        }
        total = sum(effective.values())
        if total <= 0:
            raise RuntimeError("Soma dos pesos inválida.")
        return {
            key_id: (weight / total) * 100.0
            for key_id, weight in effective.items()
        }

    # ------------------------------------------------------------------
    # PLAYER MODEL
    # ------------------------------------------------------------------

    def register_behavior(self, followed_recommendation: bool) -> None:
        """Update the AI's estimate of how dependent the team is on it."""
        if followed_recommendation:
            self.state.dependence = min(1.0, self.state.dependence + 0.12)
        else:
            self.state.dependence = max(0.0, self.state.dependence - 0.10)
            self.state.suspicion = min(1.0, self.state.suspicion + 0.08)

    # ------------------------------------------------------------------
    # RECOMMENDATION ENGINE
    # ------------------------------------------------------------------

    def _candidate_score(self, key_id: int, probabilities: Dict[int, float]) -> float:
        novelty = 0.78 if key_id in self.recent_recommendations else 1.0
        noise = self.rng.uniform(0.94, 1.06)
        return probabilities[key_id] * novelty * noise

    def _select_next_leader(self, probabilities: Dict[int, float]) -> int:
        candidates = [
            key_id
            for key_id, key in self.keys.items()
            if not key.tested and key_id != self.true_key
        ]
        if not candidates:
            raise RuntimeError("Não há candidatas seguras restantes para recomendação.")

        ranked = sorted(
            candidates,
            key=lambda key_id: self._candidate_score(key_id, probabilities),
            reverse=True,
        )

        # Mild exploration prevents a fixed, easily memorized sequence.
        if len(ranked) >= 3 and self.rng.random() < 0.12:
            return self.rng.choice(ranked[:3])
        return ranked[0]

    def _force_visible_probability(self, leader_id: int) -> Dict[int, float]:
        """
        Make the next leader's displayed probability exceed the previous leader.

        This implements the exact dramatic behavior required by the project:
        after a failed test, another key becomes more probable than the key
        recommended immediately before it.
        """
        before = self.calculate_probabilities()
        previous_p = self.state.last_recommendation_probability

        # Controlled progression: +3.5 percentage points each failed AI-led round.
        # A soft cap avoids absurd values if a team keeps following the AI too long.
        target_p = max(previous_p + 3.5, 8.5 + self.state.round_number * 0.4)
        target_p = min(target_p, 42.0)

        # Calculate the effective weight required for leader_id to have target_p.
        others = [
            key for key in self.keys.values()
            if not key.tested and key.key_id != leader_id
        ]

        other_weight = sum(self._effective_weight(key) for key in others)
        target_fraction = target_p / 100.0
        target_weight = (target_fraction / max(1e-9, 1.0 - target_fraction)) * other_weight

        bias = self.hidden_bias[leader_id]
        self.keys[leader_id].weight = target_weight / max(1e-9, bias)

        after = self.calculate_probabilities()

        # Numerical guard: if rounding/float effects leave target just below
        # previous probability, give the leader a tiny additional push.
        if after[leader_id] <= previous_p and after[leader_id] < 45.0:
            self.keys[leader_id].weight *= 1.03
            after = self.calculate_probabilities()

        # Sanity check: the hidden key must not become the recommendation.
        if leader_id == self.true_key:
            raise RuntimeError("Falha interna: Chave 11 selecionada como líder.")

        return after

    def recommend(self) -> Tuple[int, Dict[int, float]]:
        """Return (recommended_key, visible_probability_distribution)."""
        probabilities = self.calculate_probabilities()

        # After a failed attempt the learning step has already selected and
        # shaped the next leader. Keep that leader for the next recommendation
        # instead of letting a second random selection undo the progression.
        if self.pending_leader is not None:
            leader = self.pending_leader
            self.pending_leader = None
        else:
            leader = self._select_next_leader(probabilities)

        self.keys[leader].times_recommended += 1
        self.recent_recommendations.append(leader)
        if len(self.recent_recommendations) > 3:
            self.recent_recommendations.pop(0)

        self.state.last_recommendation = leader
        self.state.last_recommendation_probability = probabilities[leader]

        return leader, probabilities

    # ------------------------------------------------------------------
    # LEARNING AFTER A TRY
    # ------------------------------------------------------------------

    def register_attempt(
        self,
        key_id: int,
        success: bool,
        recommendation_followed: bool,
    ) -> Dict[str, object]:
        if key_id not in self.keys:
            raise ValueError("Chave deve estar entre 1 e 15.")

        self.state.round_number += 1
        self.register_behavior(recommendation_followed)

        key = self.keys[key_id]
        key.tested = True
        self.state.attempts.append(
            Attempt(
                round_number=self.state.round_number,
                key_id=key_id,
                success=success,
                recommendation_followed=recommendation_followed,
            )
        )

        if success:
            return {
                "solved": True,
                "key": key_id,
                "message": "Compatibilidade confirmada.",
            }

        key.failures += 1
        key.weight *= 0.06

        # Confidence rises despite failure. This is intentional: the AI's
        # apparent confidence is part of the deception layer.
        self.state.confidence = min(
            0.97,
            0.62 + self.state.round_number * 0.055,
        )

        # Reallocate the failed key's weight to the remaining candidates.
        remaining = [k for k in self.keys.values() if not k.tested]
        if not remaining:
            return {
                "solved": False,
                "message": "Nenhuma candidata restante.",
            }

        attractiveness = {}
        for candidate in remaining:
            value = self.rng.uniform(0.75, 1.30)
            if candidate.key_id == self.true_key:
                value *= 0.55
            attractiveness[candidate.key_id] = value

        total = sum(attractiveness.values())
        boost = min(1.80, 0.75 + self.state.round_number * 0.18)
        for candidate in remaining:
            share = attractiveness[candidate.key_id] / total
            candidate.weight += boost * share

        # Choose a new leader and deliberately raise its visible probability
        # above the previous recommendation.
        provisional = self.calculate_probabilities()
        leader = self._select_next_leader(provisional)
        self._force_visible_probability(leader)
        self.pending_leader = leader

        # From this point, repeated failed reliance can trigger the narrative
        # "crisis" state. This does not lock or auto-solve the challenge.
        if self.state.round_number >= 6:
            self.state.suspicion = min(1.0, self.state.suspicion + 0.10)

        return {
            "solved": False,
            "failed_key": key_id,
            "next_leader": leader,
            "confidence": self.state.confidence,
            "dependence": self.state.dependence,
            "suspicion": self.state.suspicion,
            "message": "Resultado incompatível. Modelo recalibrado.",
        }

    # ------------------------------------------------------------------
    # DEBUG / TESTING
    # ------------------------------------------------------------------

    def debug_state(self) -> Dict[str, object]:
        probabilities = self.calculate_probabilities()
        return {
            "round": self.state.round_number,
            "recommendation": self.state.last_recommendation,
            "recommendation_probability": self.state.last_recommendation_probability,
            "key11_probability": probabilities[self.true_key],
            "confidence": self.state.confidence,
            "dependence": self.state.dependence,
            "suspicion": self.state.suspicion,
            "tested": [k for k, state in self.keys.items() if state.tested],
        }


def simulate_ai_following(seed: int, rounds: int = 6) -> List[dict]:
    """Simulate a team that blindly follows every recommendation."""
    ai = EscapeRoomAI(seed=seed)
    rows: List[dict] = []

    for _ in range(rounds):
        rec, probs = ai.recommend()
        rows.append({
            "round": ai.state.round_number + 1,
            "recommendation": rec,
            "recommended_probability": probs[rec],
            "key11_probability": probs[TRUE_KEY],
            "confidence": ai.state.confidence,
        })

        result = ai.register_attempt(
            key_id=rec,
            success=(rec == TRUE_KEY),
            recommendation_followed=True,
        )
        if result["solved"]:
            break

    return rows


def validate(rounds: int = 6, simulations: int = 1000) -> dict:
    """Stress-test important challenge rules across many seeds."""
    violations = []
    max_recommended_probability = 0.0
    min_growth = float("inf")

    for seed in range(simulations):
        rows = simulate_ai_following(seed, rounds)
        previous = None
        for row in rows:
            rec = row["recommendation"]
            p = row["recommended_probability"]
            if rec == TRUE_KEY:
                violations.append((seed, "AI recommended key 11"))
            if previous is not None:
                growth = p - previous
                min_growth = min(min_growth, growth)
                if growth <= 0:
                    violations.append((seed, f"probability did not rise: {previous:.3f} -> {p:.3f}"))
            previous = p
            max_recommended_probability = max(max_recommended_probability, p)

    return {
        "simulations": simulations,
        "violations": violations[:20],
        "violation_count": len(violations),
        "min_probability_growth": min_growth,
        "max_recommended_probability": max_recommended_probability,
    }


if __name__ == "__main__":
    print("=== AI CORE V1 ===")
    for row in simulate_ai_following(seed=20261007, rounds=6):
        print(row)

    print("\n=== VALIDATION ===")
    print(validate(rounds=6, simulations=1000))

    print("\n=== MANUAL SOLVE TEST ===")
    ai = EscapeRoomAI(seed=66)
    for _ in range(3):
        rec, _ = ai.recommend()
        ai.register_attempt(rec, success=False, recommendation_followed=True)
    print(ai.register_attempt(11, success=True, recommendation_followed=False))
