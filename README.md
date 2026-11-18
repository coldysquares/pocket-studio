# Pocket Studio

A pocket studio and a songbook in one offline web app. Pay once, no account.

- `/` landing page
- `/app/` the Studio: record, quick master, video to audio, shrink video, Whisper transcription
- `/app/songbook/` the Tabbycat Songbook: plain-text tabs and chords, transpose, stage mode, auto-scroll, paste and share import
- `/app/license.js` one shared unlock for both rooms, verified on the device
- `/api/activate` turns a paid Stripe checkout session into a signed license key

Pricing model and reasoning: see `PRICING.md`.
