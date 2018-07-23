import * as functions from 'firebase-functions';
const cors = require('cors')({ origin: true })
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

const sendOKAt = (res, data, error?) =>
  res.status(200).send({
    data,
    error,
    at: new Date().toISOString()
  })

const willLink = async (provider, id, publicKey) => {
  const ref = admin.database().ref(`/${provider}`)
  await ref.child(id).set(publicKey)
  return { id }
}

export const link = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const { provider, id, publicKey } = req.body
    if (!provider) return sendOKAt(res, null, 'Required : provider')
    if (!id) return sendOKAt(res, null, 'Required : id')
    if (!publicKey) return sendOKAt(res, null, 'Required : publicKey')

    willLink(provider, id, publicKey)
      .then(payload => sendOKAt(res, payload))
      .catch(err => sendOKAt(res, null, err))
  })
})

export const oz = functions.https.onRequest((req, res) => {
  cors(req, res, () => {

    console.log(`req.body : ${JSON.stringify(req.body)}`)

    if (!req.body) return res.status(200).send({
      "dialogflow":
      {
        "message": {
          "text": `No body...`
        }
      }
    })

    const { action } = req.body
    if (!action) return res.status(200).send({
      "dialogflow": {
        "message": {
          "text": `No action...`
        }
      }
    })

    switch (action) {
      case "list.events": return res.status(200).send({
        "facebook":
        {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              elements: [
                {
                  title: 'Hyperledger 101',
                  image_url: `https://scontent.fbkk2-2.fna.fbcdn.net/v/t1.0-9/34794693_10155998076087479_3811012266577362944_n.jpg?_nc_cat=0&_nc_eui2=AeFcCK9v87b5B-BbpPAhoU2Ing-_26MwYfyBPCWzHyZMNinVMMR8zYX7yEI42UAiDDPZSa_a2oBus9G59wyCsp8vU3bhCek26GKZ1ygZeIZRng&oh=a37021d18af6f714cf77b43c65324ed7&oe=5BC5D293`,
                  subtitle: 'Saturday, July 28 at 1:00 PM at HUBBA',
                  default_action: {
                    type: 'web_url',
                    url: 'https://www.facebook.com/events/616312025409172/'
                  },
                  buttons: [
                    {
                      type: 'web_url',
                      url: 'https://www.facebook.com/events/616312025409172/',
                      title: 'See more detail'
                    },
                    {
                      type: 'postback',
                      title: 'Join Hyperledger 101',
                      payload: 'Join Hyperledger 101'
                    }
                  ]
                },
                {
                  title: 'Stellar 101',
                  image_url: `https://scontent.fbkk2-2.fna.fbcdn.net/v/t1.0-9/29511110_10155830964722479_553681704110319426_n.jpg?_nc_cat=0&_nc_eui2=AeH98IVglela-LVN3vdiAeiX7eJPRK3KupdEmS1e9HXgLgqyp97mzrjJ9JG5gop725LU5VgZNSq9U6I7mB9QjB9dhqHZeylw5JnuOHOc3k2OAQ&oh=355a8b6399aa425ea96bdca846ab55d6&oe=5BC97552`,
                  subtitle: 'Sunday, July 29 at 1:00 PM at HUBBA',
                  default_action: {
                    type: 'web_url',
                    url: 'https://www.facebook.com/groups/164076170920853/'
                  },
                  buttons: [
                    {
                      type: 'web_url',
                      url: 'https://www.facebook.com/events/616312025409172/',
                      title: 'See more detail'
                    },
                    {
                      type: 'postback',
                      title: 'Join Stellar 101',
                      payload: 'Join Stellar 101'
                    }
                  ]
                }
              ]
            }
          }
        }
      })
      case "events.tickets.book-yes": return res.status(200).send({
        "dialogflow":
        {
          "type": "Image",
          "imageUrl": "https://firebasestorage.googleapis.com/v0/b/catcatchatbot.appspot.com/o/0b0a69b119e86bb5c66bd1e3e72f853062bec514375c4ad25187a945891fa18b.png?alt=media&token=69e49c03-1d9b-4749-a529-2d3ac6b900e3"
        }
      })
      default: return ({
        "dialogflow":
        {
          "message": {
            "text": `Something went wrong with ${action}`
          }
        }
      })
    }
  })
})
