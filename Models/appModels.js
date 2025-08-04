import mysql from 'mysql2/promise'

const connection = mysql.createPool('mysql://root:prmiAsmkCzVtjUpAZwFpQzymSudERoBN@metro.proxy.rlwy.net:59014/railway')

export class AppModels {
  static getPosts = async () => {
    try {
      const [ posts ] = await connection.query(`
        SELECT 
          u.username,
          COUNT(DISTINCT c.comment_id) AS post_comments,
          COUNT(DISTINCT l.user_id) AS post_likes,
          u.img AS user_image,
          BIN_TO_UUID(t.post_id) AS id,
          BIN_TO_UUID(t.creator) AS creator,
          t.created_at,
          t.img,
          t.text
        FROM thoughts t
        JOIN users u ON u.user_id = t.creator
        LEFT JOIN comments c ON c.post_id = t.post_id
        LEFT JOIN likes l ON l.post_id = t.post_id
        GROUP BY t.post_id
        ORDER BY t.created_at DESC
      `)
      if(posts.length <= 0) return []
      return posts
    } catch (e)  {
      throw new Error('error with the database', e)
    }
  }

  static getPostsByUser = async (id) => {
    if(typeof id !== 'string' || id.trim('') === '') throw new Error('invalid ID')
    try {
      const [ posts ] = await connection.query(`
        select u.username, u.img user_img,  count(DISTINCT c.comment_id) post_comments, count(DISTINCT l.user_id) post_likes, bin_to_uuid(t.post_id) id, bin_to_uuid(t.creator) creator, t.created_at, t.img, t.text from thoughts t
        join users u on u.user_id = t.creator
        left join comments c on c.post_id = t.post_id
        left join likes l on l.post_id = t.post_id
        where t.creator = uuid_to_bin(?)
        GROUP by t.post_id
        order by t.created_at desc`, [id])
      if(posts.length <= 0) return null
      return posts
    } catch (e) {
      throw new Error(e.message)
    }
  }

  static getUser = async (id) => {
    try {
      const [ user ] = await connection.query('select bin_to_uuid(user_id) id, username, img, password, name, lastname, age, email from users where uuid_to_bin(?) = user_id', [id])
      if(user.length === 0) return null
      return user[0]
    } catch (e) {
      throw new Error('database error:' +e.message)
    }
  }

  static getLikes = async () => {
    try {
      const [likes] = await connection.query(` select bin_to_uuid(post_id) post_id, bin_to_uuid(user_id) user_id  from likes`)
      if(likes.length === 0) return
      return likes
    } catch (e) {
      throw new Error('error with the database')
    }
  }

  static login = async ({ username, password }) => {
    try {
      const [ user ] = await connection.query('SELECT bin_to_uuid(user_id) id, username, img, password, name, lastname, age, email FROM users WHERE username = ? AND password = ?', [username, password])
      if (user.length === 0) return null
      return user[0]
    } catch (e) {
      throw new Error('error with the database' + e)
    }
  }

  static register = async ({ username, password, email, age, name, img, lastname }) => {
    try {
      const [users] = await connection.query(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, email]
      )

      if (users.length > 0) return null

      const [ result ] = await connection.query('insert into users (username, password, name, lastname, img, age, email) VALUES (?, ?, ?, ?, ?, ?, ?)', [username, password, name, lastname, img, age, email])
      if (result.affectedRows === 0) return 'error in the register'
      return 'user registered successfully!'
    } catch (e) {
      throw new Error('error with the database' + e)
    }
  }

  static deleteAccount = async ({ id }) => {
    try {
      const [ result ] = await connection.query('DELETE FROM users WHERE user_id = uuid_to_bin(?)', [id])
      if (result.affectedRows === 0) return null
      return 'user deleted successfully'
    } catch (e) {
      throw new Error('error with the database' + e)
    }
  }

  static likePost = async ({ userId, postId }) => {
    try {
      const [ like ] = await connection.query('insert into likes (user_id, post_id) values (uuid_to_bin(?), uuid_to_bin(?))', [ userId, postId ])

      if(like.affectedRows === 0) return null

      return 'post liked'
    } catch (e) {
      throw new Error(e.message)
    }
  }

  static dislikePost = async (postId, userId) => {
    try {
      const [dislike] = await connection.query('delete from likes where post_id = uuid_to_bin(?) and user_id = uuid_to_bin(?)', [postId, userId])
      if (dislike.affectedRows === 0) return null
      return 'post disliked'
    } catch (e) {
      throw new Error('error with the database' + e)
    }
  }

  static createPost = async ({ text, img, creator }) => {
    try {
      let query, values;

      if (img !== null && img !== undefined && img !== '') {
        query = 'INSERT INTO thoughts (text, img, creator) VALUES (?, ?, uuid_to_bin(?))';
        values = [text, img, creator];
      } else {
        query = 'INSERT INTO thoughts (text, creator) VALUES (?, uuid_to_bin(?))';
        values = [text, creator];
      }

      const [newPost] = await connection.query(query, values);

      if (newPost.affectedRows === 0) return null

      return 'post created successfully';
    } catch (e) {
      throw new Error('database error')
    }
  }

  static deletePost = async ({ postToRemove }) => {
    if(typeof postToRemove !== 'string' || postToRemove.trim('') === '') throw new Error('invalid ID')
    try {
      const [drop] = await connection.query('delete from thoughts where post_id = uuid_to_bin(?)', [postToRemove])
      if(drop.affectedRows === 0) return null
      return 'post deleted'
    } catch (e) {
      throw new Error('database error' + e.message)
    }
  }

  static comment = async ({ postId, userId, commentText }) => {
    console.log(postId, userId, commentText)
    if(!postId || !userId || !commentText) throw new Error('invalid data provided')
    try {
      const [comment] = await connection.query('insert into comments (post_id, creator, comment_text) values (uuid_to_bin(?), uuid_to_bin(?),  ?)', [postId, userId, commentText])
      if(comment.affectedRows === 0) return null
      const [user] = await connection.query('select bin_to_uuid(user_id) id, username, img from users where user_id = uuid_to_bin(?)', [userId])

      const commentToReturn = {
        id: comment.insertId,
        img: user[0].img,
        username: user[0].username
      }

      return commentToReturn
    } catch (e) {
      console.error(e)
      throw new Error('database error' + e.message)
    }
  }

  static getComments = async () => {
    try {
      const [comments] = await connection.query(`
        select comment_id id, u.img,  u.username, u.img img, c.comment_text, bin_to_uuid(c.post_id) post_id, c.created_at from comments c 
        join users u on u.user_id = c.creator;
      `)
      if(comments.length === 0) return []
      return comments
    } catch (e) {
      throw new Error('database error')
    }
  }

  static getUserById = async (id) => {
    if(typeof id !== 'string' || id.trim('') === '') throw new Error('invalid ID')
    try {
      const [user] = await connection.query('select bin_to_uuid(user_id) id, username, img, password, name, lastname, age, email from users where user_id = uuid_to_bin(?)', [id])
      if(user.length === 0) return null
      return user[0]
    } catch (e) {
      throw new Error('database error' + e.message)
    }
  }

  static getUserByName = async (search) => {
    if(!search || search === '') return null

    console.log(search)
    try {
      const [ users ] =  await connection.query(`
        select username, name, lastname, img, bin_to_uuid(user_id) id from users
        where username like(?)
      `, [`%${search}%`])

      if(users.length === 0) return null
      return users
    } catch (e) {
      throw new Error(e.message)
    }
  }

  static editProfile = async ({ username, name, lastname, email, age, id }) => {
    console.log(id)
    try {
      const [ edit ] = await connection.query(`
        update users 
        set 
          username = ?,
          name = ?,
          lastname = ?,
          email = ?,
          age = ? 
        where user_id = uuid_to_bin(?)
      `, [ username, name, lastname, email, age, id ])

      if(edit.affectedRows === 0) return null

      const [ user ] = await connection.query(`
        select 
          username, img, name, lastname, email, age, bin_to_uuid(user_id) id, password
        from users where user_id = uuid_to_bin(?)
      `, [id])

      if(user.length  === 0) return null
      return user
    } catch (e) {
      throw new Error(e.message)
    }
  }

  static editImage = async (img, id) => {
    if(!img || !id) return null
    try { 
      const [edit]  = await connection.query(`
        update users
        set img = ?
        where user_id = uuid_to_bin(?)
      `, [ img, id ])

      if(edit.affectedRows === 0) return null
      return 'changed'
    } catch (e) {
      throw new Error('database error')
    }
  }
}