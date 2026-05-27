# Balancing Notes

## Current Balance Profile

This version uses the v0.3 physical-table balance pass:

- Life Trial Darkness stays on the 5-11 scale.
- The starter hand draw bug was fixed; players now draw a full hand instead of one card.
- Up to 4 cards may be played per round.
- Clean Victory gives +3 Fruits.
- Mixed Victory gives +2 Fruits and +1 Attachment.
- Final Choice Darkness is 10 plus +2 for each Attachment above 5.

Latest solo Normal simulation baseline:

```bash
npm run sim:headless -- --games 30000 --workers 6 --pretty false
```

Observed profile:

| Metric | Result |
|---|---:|
| Win rate | ~49% |
| Christ's Banner choices | ~77% |
| Shortcut choices | ~23% |
| Clean victories | ~77% of rounds |
| Mixed victories | ~9% of rounds |
| Final Choice success | ~65% |
| Average Attachment | ~1.3 |
| Average Desolation | ~1.0 |

This is close to the desired early physical prototype target: 40-60% solo win rate and about 1-3 shortcuts per game.

## Why These Changes Were Made

The initial concept was too difficult because the starter deck produced too little Light for Darkness values in the 12–16 range.

The current Darkness scale is:

| Trial Difficulty | Darkness |
|---|---:|
| Simple | 5–6 |
| Normal | 7–8 |
| Hard | 9–10 |
| Major discernment | 11 |
| Final Choice | 10 + Attachment penalty |

## Fervor Risk

Fervor is the most dangerous balance lever.

Example:

```text
8 Light × 3 Fervor = 24 Result
```

This can create a sharp power curve. Do not buff Fervor too early. Prefer tuning Darkness, Fruits, and card costs first.

## First Things to Watch

- If players always win without shortcuts, raise Trial Darkness by 1.
- If players cannot reach Communion 5, lower Darkness or add more Communion rewards.
- Avoid using both `starterHandSolo=6` and `cleanVictory.communion=2` as the default balance: together they push solo Normal above a 70% win rate.
- If players buy only Gifts, Gifts may be undercosted.
- If Sacraments are rarely bought, reduce some Sacrament costs or increase Fruits.
- If manual modifiers are too frequent, automate the most common conditional effects.
