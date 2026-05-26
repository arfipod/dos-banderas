# Implementation Notes

## Current Intent

The simulator is intentionally a semi-automated playtest tool, not a final digital board game.

It automates:

- deck setup
- draw
- reveal
- play cards
- score calculation
- round resolution
- buying cards
- playtest logs

It leaves some effects manual because the prototype is still being balanced.

## Why Manual Modifiers Exist

Many cards contain conditional effects such as:

- a Virtue answering a specific Sin
- Prayer before a Gift
- a Saint modifying a card
- a Sacrament transforming a failure
- a Dark Banner penalty being cancelled

Hardcoding every interaction too early would freeze bad design. Manual modifiers keep iteration fast.

## Future Automation Candidates

The first effects worth automating later are:

1. Virtue opposed-sin bonus.
2. Prayer before Gift.
3. Examen converting failure.
4. Dark Banner penalties.
5. Church Row cost reductions.
6. Purification of Sins from discard/deck.
