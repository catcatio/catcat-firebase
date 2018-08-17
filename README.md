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

- - -

## TODO - Alpha
- [ ] `[BEFORE.EVENTS.BOOK]` User should get notify if QR has been scan.
> `[UNUSED]`
```txt
Your ticket has been scanned, but it seem to be invalid.
```
> `[BOOKED]`
```txt
Your ticket has been scanned, please wait for validation.
```
> `[BOOKED.VALID]`
```txt
Welcome to "Hyperledger 101" event! Enjoy!
```
> `[BOOKED.INVALID]`
```txt
Your ticket seem to be invalid, please contact admin.
```
- [ ] `[AT.EVENTS]` User should get notify if QR has been scan.
> `[USED]`
```txt
Your ticket has been scanned, this ticket has been using for 3 times.
```
- - -

## TODO - Beta
- [ ] `[BEFORE.EVENTS.BOOK]` Creator can submit event by post facebook event link.
- [ ] `[AT.EVENTS]` User can reuse ticket with welcome message for re-enter events (re-scan will see `This ticket has been use`).
- [ ] `[AFTER.EVENTS]` User will see `ending message` after events end.
  ```txt
  Thank you for joining ${event-title}
  We hope to see you at our next event!
  ```
- [ ] `[AFTER.EVENTS.ATTENDED]` User will ask for `rating`.
  ```txt
  How much you enjoy this events?
  ```
  `😑 boring` `🤔 soso` `🙂 nice` `🤩 superb`
- [ ] User will ask for `suggestions` after `rating`.
  ```txt
  Any suggestions?
  ```
- [ ] Creator will able to see re-playable real-time dashboard

- - -

## TODO - v1
- [ ] `[AT.EVENTS.ATTENDED]` Attending user get notify when events has been start, addition info e.g. slide link will provide at this state.
- [ ] Creator can ask poll.
- [ ] Creator able to see poll results and stop.
- [ ] Creator will able to export usage data (limited to 10) by using `export` command.
  `Free (first 10 records)` `Paid (5 THB/Record)`

  ```txt
  user_id | user_name | line_id | facebook_id | onboard_date | book_date | attend_date | subscribe_date | active_date | email | rating | suggestion
  ```

## TODO - v2
- [ ] `[BEFORE.EVENTS.BOOK]` User can use `LINE PAY` for purchase tickets.