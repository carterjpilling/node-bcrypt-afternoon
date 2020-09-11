const bcrypt = require('bcryptjs')

module.exports = {
  register: async (req, res) => {
    const { username, password, isAdmin } = req.body
    const db = req.app.get('db')

    const result = await db.get_user(username)

    const existingUser = result[0]

    if (existingUser) {
      return res.status(409).send('Username is taken. Please try again.')
    }

    const salt = bcrypt.genSaltSync(10)

    const hash = bcrypt.hashSync(password, salt)

    const registeredUser = await db.register_user([isAdmin, username, hash])

    const user = registeredUser[0]

    req.session.user = user

    res.status(201).send(req.session.user)
  },
  login: async (req, res) => {
    const { username, password } = req.body
    const db = req.app.get('db')

    const foundUser = await db.get_user([username])

    if (!foundUser[0]) {
      return res.status(401).send('User not found. Please register as a new user before logging in.')
    }

    const user = foundUser[0]

    const isAuthenticated = bcrypt.compareSync(password, user.hash)

    if (!isAuthenticated) {
      return res.status(403).send('Incorrect password or email. (Its password)')
    }

    delete foundUser[0].hash

    req.session.user = user

    res.status(200).send(req.session.user)

  },
  logout: async (req, res) => {
    req.session.destroy()
    return res.sendStatus(200)
  }
}