# catcat-firebase

Firebase related

## Preparation for local development

- create `serviceAccountKey.json` under `firebase`

```shell
> cd firebase/functions
> firebase functions:config:get > .runtimeconfig.json
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
```

## TODO

### Before event

#### Localization

- [ ] Support Thai conversation

#### Welcome process

- [x] User will see welcome message via `LINE`.
  > We can determine user linked with provider via `provider.line_${line_id}`
  > and store user's session in `sessions` collection

  ```txt
  How can I help you?
  ```

  `Show events` `Nothing`

#### List process

- [ ] User will see `ticket_brought/ticket_max` beside `JOIN` button.

  ```txt
  JOIN (10/100)
  ```

- [ ] Event list cards to support desktop version

#### Book process

- [x] User will see `QR` ticket with user name after book in middle center.
- [x] User will see `QR` ticket with user profile picture after book in middle center.
- [x] User will see `QR` ticket with event token code as mask at top.
- [x] User will see `QR` ticket with event bump code as mask at bottom.

#### At event

#### Confirm process

- [x] Creator will see `Card` with user name, user profile, event title, event description while doing confirm.
- [x] Creator can `confirm` via `Card`.

#### After event

- [ ] Creator will able to command `burn` with confirmation

  ```txt
  Burn all unused tickets?`
  ```

  `OK` `Cancel`
- [ ] User will see `ending message`

  ```txt
  Thank you for booked (and join) $event-title
  We hope to see you at our next event!
  ```

  and `Your ticket has been expire`
- [ ] User will see subscriptions offer after `ending message`

  ```txt
  Please enter your email for subscriptions (free for now)
  ```

- [ ] Creator will able to list last 10 subscribed email by using `sub` command.
- [ ] User will ask for `rating`.

  ```txt
  How much you enjoy this events?
  ```

  `😑 boring` `🤔 soso` `🙂 nice` `🤩 superb`
- [ ] User will ask for `suggestions`.

  ```txt
  Any suggestions?
  ```

- [ ] Creator will able to export usage data (limited to 10) by using `export` command.
  `Free (first 10 records)` `Paid (5 THB/Record)`

  ```txt
  user_id | user_name | line_id | facebook_id | onboard_date | book_date | attend_date | subscribe_date | active_date | email | rating | suggestion
  ```