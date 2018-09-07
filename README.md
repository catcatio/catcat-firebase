# catcat-firebase

Firebase related

## Preparation for local development

- create `serviceAccountKey.json` under `firebase`

```bash
> cd firebase/functions
> firebase functions:config:get > .runtimeconfig.json
```

- setup gcloud-cli for deploying to asia-northeast1 [quickstart guide](https://cloud.google.com/sdk/docs/quickstart-macos)

- Sign in with gcloud-cli and select your project

```bash
> gcloud init
```

## Develop

under `firebase/functions`

```bash
# Develop
npm run dev

# Local serve
npm run serve

# Deploy functions
npm run deploy

# Deploy asia region
npm run deploy:asia
```

- - -

## States
### Events
 - `[BEFORE.EVENTS.BOOK]`         : User booking before event occurs.
 - `[BEFORE.EVENTS.BOOKED]`       : User has been booked before event occurs.
 - `[AT.EVENTS.ATTENDED]`         : User has been attended at event period.
 - `[AT.EVENTS.NOT_ATTENDED]`     : User has not attended at event period.
 - `[AFTER.EVENTS.ATTENDED]`      : User has been attended after event period.
 - `[AFTER.EVENTS.NOT_ATTENDED]`  : User has not attended after event period.

### Tickets Period
- `[INITIAL]` : Ticket that sale between presale period, aim for co-founder.
- `[INTERNAL]` : Ticket that sale between presale period, aim for friends.
- `[PRIVATE]` : Ticket that sale between private round period, aim for investor.
- `[PRE]` : Ticket that sale between early round period, aim for early-bird
- `[PUBLIC]` : Ticket that sale between public round period, aim for bird.

### Tickets States
 - `[UNUSED]` : Ticket has not been used.
 - `[BOOKED]` : Ticket has been booked.
 - `[USED]` : Ticket has been used.
 - `[AUCTIONED]` : The `[PUBLIC]` ticket that auciton after public round period has been fulfil, aim for late brid.

### beta
- [ ] Consumer can have physical card.
- [ ] Consumer can scan `QR` for public key and get balance [#8](https://github.com/catcatio/catcat-firebase/issues/8)

### v1
- [x] Consumer can `list` events with `used/available` information.
- [x] Consumer can `book` tickets if `available`.
- [x] Consumer can `use` unused ticket.
- [x] Producer can see ticket card before confirm.
- [x] Producer can `confirm` tickets.

