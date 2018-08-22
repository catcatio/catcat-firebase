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

### Tickets
 - `[UNUSED]` : Ticket has not been used.
 - `[BOOKED]` : Ticket has been booked.
 - `[USED]` : Ticket has been used.

### v1
- [x] Consumer can `list` events with `used/available` information.
- [x] Consumer can `book` tickets if `available`.
- [x] Consumer can `use` unused ticket.
- [x] Producer can see ticket card before confirm.
- [x] Producer can `confirm` tickets.

