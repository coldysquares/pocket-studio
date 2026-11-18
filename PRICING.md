# Pocket Studio pricing model

## The model

One product, one price: **$25, paid once**, unlocks everything on the device. No account, no subscription.

| | Free | Unlocked ($25 once) |
|---|---|---|
| Studio tools (record, master, video, transcribe) | Use all of them | Use all of them |
| Save audio and video | No | Yes |
| Songbook songs | 10 | Unlimited |
| Transpose, stage mode, auto-scroll | Yes | Yes |
| Backup export | Yes | Yes |
| Offline | Yes | Yes |

The free tier is a real product, not a demo. People hit the paywall at the moment they've gotten value: a finished master they want to keep, or an 11th song.

## Why these gates

- **Saving files** (Studio): the result is the value. You hear the master before you pay for it.
- **10 songs** (Songbook): enough to learn the app and play a short set. A working musician's book passes 10 fast. OnSong's free tier stops at 30 songs and then charges a subscription.
- **Backup export stays free.** Locking people out of their own songs is the fastest way to earn bad reviews.
- **Stage mode and transpose stay free.** They're the hook that makes someone move their songs in.

## Where it sits in the market (checked Nov 2026)

- OnSong (iPad songbook standard): free up to 30 songs, then Essentials $3.99/month or $29.99/year, Premium $5.99/month or $59.99/year. Reviews complain about the switch from pay-once to subscription. Source: apppricinglab.com/app/apple/1330350343
- Ultimate Guitar Pro: about $40/year, sold partly on removing ads. Source: happynewguitarday.com/is-ultimate-guitar-pro-worth-it/

$25 once is less than one year of OnSong Essentials, and it includes a recorder, mastering and transcription that OnSong doesn't have. That's the pitch: **less than a year of theirs, and it's yours forever.**

## Why not ads

The Songbook's main screen is read mid-song on stage. Ads there make the product worse at the one thing it's for, and at current traffic the revenue would be close to zero. Competitors sell "no ads" as a paid perk.

## How the unlock works (already built)

1. Buyer pays through the existing Stripe payment link.
2. Stripe sends them back to `/app/?session_id=...`; `/api/activate` checks the payment and returns a signed key.
3. The key is verified on the phone with a public key, so it works offline. One key unlocks both the Studio and the Songbook (`app/license.js`).
4. New phone: paste the key under "Already bought? Enter key".

No Stripe changes were needed for this version.

## Levers for later (not built)

- **Launch price**: $15 for the first buyers, then $25. Needs a second Stripe price and payment link.
- **Editions**: Pocket Writer, Pocket Office as separate $25 unlocks, with a bundle discount.
- **Key sharing**: keys aren't tied to a device. Fine at this stage; revisit only if sales show abuse.

## What to watch

Visits to the landing page, free users who open the Songbook, paywall views (Songbook full, Unlock to save), and purchases. The paywall-to-purchase rate tells you whether the price or the gate needs to move.
