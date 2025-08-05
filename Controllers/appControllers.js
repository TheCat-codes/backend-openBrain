import { AppModels } from "../Models/appModels.js"
import { validateRegister, validateUser } from "../zod.js"
import jwt from 'jsonwebtoken'
import cloudinary from './uploadData/cloudinary.js'

export class AppControllers {
  static getPosts = async (req, res) => {
    try {
      const posts = await AppModels.getPosts()
      if (posts.length === 0) res.status(404).json({ message: 'no posts avvailables' })
      res.status(200).json({ posts })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }

  static getPostsByUser = async (req, res) => {
    const { id } = req.params
    if (id.length < 36 || id.length > 36) {
      return res.status(400).json({ error: 'id invalido' })
    }

    try {
      const posts = await AppModels.getPostsByUser(id)
      if (posts.length === 0) return res.status(404).json({ message: 'no posts avvailables' })
      res.status(200).json({ posts })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }

  static login = async (req, res) => {
    try {
      const result = validateUser(req.body)
      if (result.error) {
      return res.status(400).json({ message: JSON.parse(result.error.message)[0].message })
    }

      const { username, password } = req.body
      
      const user = await AppModels.login({ username, password })
      if (!user) return res.status(401).json({ message: 'Invalid credentials' })
      
      const token = jwt.sign({ id: user.id, email: user.email, img: user.img, username: user.username, age: user.age }, process.env.TOKEN_KEY, { expiresIn: '1h' })
      res.cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: 1000 * 60 * 15
      })
      res.status(200).json({ user })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }

  static getUser = async (req, res) => {
    const token = req.cookies.access_token
    if (!token) return res.status(401).json({ message: 'No token' })

    try {
      const payload = jwt.verify(token, process.env.TOKEN_KEY)
      const user = await AppModels.getUser(payload.id)
      res.status(200).json(user)
    } catch {
      res.status(403).json({ message: 'Token inválido' })
    }
  }

  static getLikes = async (req, res) => {
    try {
      const likes = await AppModels.getLikes()
      if (!likes) return res.status(404).json({ likes: []})
      res.status(200).json({ likes })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }

  static verify = (req, res) => {
    res.status(200).json({ user: req.user })
  }

  static register = async (req, res) => {
    try {
      const { username, password, email, name, lastname, age } = req.body
      const result = validateRegister({ username, password, email, name, lastname, age: parseInt(age) })
      if(result.error) {
        return res.status(400).json({ message: JSON.parse(result.error.message)[0].message })
      }

      let img = null
      if(req.file) {   
        const uploadImage = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'openBrain' },
            (error, results) => {
              if(error) return reject(error)
              resolve(results)
            }
          )
          stream.end(req.file.buffer)
        })

        img = uploadImage.secure_url
      }

      const user = await AppModels.register({ username, password, email, age, img, name, lastname })
      if (!user) return res.status(400).json({ message: 'User already exists' })

      res.status(201).json({ message: user })
    } catch (e) {
      res.status(500).json({ message: e.message })
    }
  }

  static editImage = async (req, res) => {
  const { id } = req.body
  let img = null

  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' })
  }

  try {
    const upload = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'openBrain' },
        (err, result) => {
          if (err) return reject(err)
          resolve(result)
        }
      )
      stream.end(req.file.buffer) // << Envía el archivo aquí
    })

    img = upload.secure_url

    if (!img) {
      return res.status(400).json({ error: 'Invalid image upload' })
    }

    const edit = await AppModels.editImage(img, id)
    if (!edit) {
      return res.status(400).json({ message: 'Try later...' })
    }

    return res.status(200).json({ message: 'Edited successfully' })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}


  static logout = (req, res) => {
    res.clearCookie('access_token',{
      httpOnly:true,
      secure: true,
      ameSite:'none'
    })
    res.status(200).json({ message: 'Logged out successfully' })
  }

  static deleteAccount = async (req, res) => {
    const { id } = req.params
    if (id.length < 36 | id.length > 36){
      return res.status(400).json({ error: 'id invalido' })
    }

    try{
      const result = await AppModels.deleteAccount({ id })

      if(!result) return res.status(400).json({ message: 'User not found or already deleted' })

      res.clearCookie('access_token')
      res.status(200).json({ message: result })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  static likePost = async (req, res) => {
    const { userId, postId } = req.body

    if(!userId || !postId) {
      return res.status(400).json({ error: 'no data provided' })
    }

    try {
      const like = await AppModels.likePost({ userId, postId })
      if (!like) return res.status(400).json({ message: 'couldnt like the video' })
      res.status(200).json({ message: like})
    } catch (e) {
      throw new Error('server error' + e)
    }
  }

  static dislikePost = async (req, res) => {
    const { postId, userId } = req.body

    if(!postId || !userId) {
      return res.status(400).json({ error: 'no data provided' })
    }

    try {
      const dislike = await AppModels.dislikePost(postId, userId)
      if (!dislike) return res.status(400).json({ message: 'couldnt dislike the video' })
      res.status(200).json({ message: dislike })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }

  static createPost = async (req, res) => {
    try {
      const { text, creator } = req.body

      if(!text || !creator || typeof text !== "string") return res.status(400).json({ error: 'no data provided'})

      let img = null
      if(req.file) {   
        const uploadImage = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'openBrain' },
            (error, results) => {
              if(error) return reject(error)
              resolve(results)
            }
          )
          stream.end(req.file.buffer)
        })

        img = uploadImage.secure_url
      }

      const create = await AppModels.createPost({ text, img, creator})
      if (!create) return res.status(400).json({ error: 'try later' })
      return res.status(201).json({ message: create})

    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }

  static deletePost = async (req, res) => {
    const { postToRemove } = req.params

    if(!postToRemove) return res.status(400).json({ message: 'no data provided' })

    try {
      const drop = await AppModels.deletePost({ postToRemove })
      if(!drop) return res.status(400).json({ message: 'error while deleting the post' })
      res.status(200).json({ message: 'post deleted...'})
    } catch (e) {
      res.status(500).json({ message: e.message})
    }
  }

  static comment = async (req, res) => {
    const { postId, userId, commentText } = req.body

    if(!postId || !userId || !commentText) {
      return res.status(400).json({ error: 'no data provided' })
    }

    try {
      const result = await AppModels.comment({ postId, userId, commentText })
      if (!result) return res.status(400).json({ message: 'couldnt comment on the post' })
      res.status(200).json({ comment: result })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  } 

  static getComments = async (req, res) => {
    try {
      const comments = await AppModels.getComments()
      if (!comments) return res.status(404).json({ message: comments })
      res.status(200).json({ comments })
    } catch (e)  {
      res.status(500).json({ error: e.message })
    }
  }

  static getUserById = async (req, res) => {
    const { id } =  req.params

    if(!id) return res.status(400).json({ error: 'no id provided' })

    const user = await AppModels.getUserById(id)

    if(!user) return res.status(404).json({ message: 'user not found' })
    res.status(200).json({ user })
  }

  static getUserByName = async (req, res) => {
    const { search } = req.params

    try {
      const users = await AppModels.getUserByName(search)
      if(!users) return res.status(404).json({ users: [] })

      res.status(200).json({ users })
    } catch (e) {
      res.status(500).json({ error: e.message})
    }
  }

  static editProfile = async (req, res) => {    
    console.log(req.body)
    try{
      const { username, name, lastname, email, age, id } = req.body
      const edit = await AppModels.editProfile({ username, name, lastname, email, age, id })
      if(!edit) return res.status(400).json({ error : 'error'})
      res.status(200).json({ user: edit })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }
}