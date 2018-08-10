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

## TODO - Alpha

### Before event

#### Localization

- [ ] Support Thai conversation

#### List process

- [ ] User will see `ticket_brought/ticket_max` beside `BOOK` button.

  ```txt
  BOOK (10/100)
  ```

- [ ] Event list cards to support desktop version

- - -

## TODO - Beta

#### Book process

- [ ] User can use `LINE PAY` for purchase tickets.

### At event

- [ ] Attending user get notify when events has been start, additoin info e.g. slide link will provide at this state.

#### Revisit process

- [ ] User can reuse ticket for re-enter events.

### After event

- [ ] User will see `ending message` after events end.

  ```txt
  Thank you for booked (and join) $event-title
  We hope to see you at our next event!
  ```

  and `Your ticket has been expire`
- [ ] User will see subscriptions offer (via [LINE Notify](https://notify-bot.line.me/doc/en/)?) after `ending message`
- [ ] Creator will able to list last 10 subscribers by using `sub` command.
- [ ] User will ask for `rating`.

  ```txt
  How much you enjoy this events?
  ```

  `😑 boring` `🤔 soso` `🙂 nice` `🤩 superb`
- [ ] User will ask for `suggestions`.

  ```txt
  Any suggestions?
  ```

- - -

## TODO - v1

### Before events

- [ ] Creator can submit event by post facebook event link.

### At event

- [ ] Creator can ask poll.
- [ ] Creator able to request poll results.

### After event

- [ ] Creator will able to export usage data (limited to 10) by using `export` command.
  `Free (first 10 records)` `Paid (5 THB/Record)`

  ```txt
  user_id | user_name | line_id | facebook_id | onboard_date | book_date | attend_date | subscribe_date | active_date | email | rating | suggestion
  ```
