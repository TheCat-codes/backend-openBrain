import { Router } from 'express'
export const router = Router()
import { AppControllers } from '../Controllers/appControllers.js'
import { upload } from '../Controllers/uploadData/multer.js'
import { verifyToken } from '../middlewares/verifyToken.js'
import { AppModels } from '../Models/appModels.js'

router.get('/', (req, res) => {
  res.send('server running')
})
router.get('/getPosts', AppControllers.getPosts)
router.get('/getPostsById/:id', AppControllers.getPostsByUser)
router.get('/getUserById', verifyToken, AppControllers.getUser)
router.get('/search/:search', verifyToken, AppControllers.getUserByName)
router.get('/getProfile/:id', verifyToken, AppControllers.getUserById)
router.get('/getComments',verifyToken, AppControllers.getComments)
router.get('/getLikes', verifyToken, AppControllers.getLikes)
router.post('/login', AppControllers.login)
router.post('/likePost', verifyToken, AppControllers.likePost)
router.post('/dislikePost', verifyToken, AppControllers.dislikePost)
router.post('/register', upload.single('image'), AppControllers.register)
router.post('/logout', verifyToken, AppControllers.logout)
router.delete('/deleteAccount/:id', verifyToken, AppControllers.deleteAccount)
router.delete('/deletePost/:postToRemove', verifyToken, AppControllers.deletePost)
router.post('/createPost',verifyToken, upload.single('image'), AppControllers.createPost)
router.post('/commentPost', verifyToken, AppControllers.comment)
router.post('/editProfile', verifyToken, AppControllers.editProfile)
router.post('/editImage', verifyToken, upload.single('image'), AppControllers.editImage)
router.get('/verifyToken', verifyToken, AppControllers.verify)