const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const path = require('path')
const multer = require('multer')
const sqlite3 = require('sqlite3').verbose()
const app = express();
const PORT = 3000;

// defining pictures storage middlewares
const profilePicturesStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/profilePictures/')
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
})
const profilePicturesUpload = multer({storage: profilePicturesStorage})

const recipePicturesStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/recipePictures/')
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
})
const recipePicturesUpload = multer({storage: recipePicturesStorage})


app.use(cookieParser())
app.use(bodyParser.json())

const db = new sqlite3.Database('database.db')

// Creating users table in the database
db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS Users (id INTEGER PRIMARY KEY, firstName TEXT, lastName TEXT, email TEXT, password TEXT, profilePicture TEXT)')
    db.run('CREATE TABLE IF NOT EXISTS Follows (id INTEGER PRIMARY KEY, email TEXT, follows TEXT)')
    db.run('CREATE TABLE IF NOT EXISTS Recipes (id INTEGER PRIMARY KEY, email TEXT, recipeName TEXT, recipePicture TEXT, restrictions TEXT, kind TEXT, ingredients TEXT, instructions TEXT CHECK(length(instructions) <= 300), cookingTime INT, time DATE)')
    db.run('CREATE TABLE IF NOT EXISTS Likes (id INTEGER PRIMARY KEY, email TEXT, recipeId INTEGER)' )
    db.run('CREATE TABLE IF NOT EXISTS Comments (id INTEGER PRIMARY KEY, recipeId INTEGER, email TEXT, content TEXT, time DATE)')
    db.run('CREATE TABLE IF NOT EXISTS Logs (id INTEGER PRIMARY KEY, logContent TEXT, time DATE)')

    // adding admin user if not exists
    db.get('SELECT * FROM Users WHERE email = "admin"', (err, row) => {
        if (err) {
            console.log('Database error:', err)
        }
        if (!row) {
            db.run('INSERT INTO Users (firstName, lastName, email, password) VALUES ("Admin", "", "admin", "admin")', (error) => {
                if (error) {
                    console.log('Database error:', error)
                }
            })
        }
    })
})

function convertToSQLTime(time) {
    let year = time.getFullYear()
    let m = time.getMonth() + 1    // zero indexed
    let month = (m < 10) ? '0' + m : m
    let d = time.getDate()
    let day = (d < 10) ? '0' + d : d
    let h = time.getHours()
    let hours = (h < 10) ? '0' + h : h
    let mi = time.getMinutes()
    let minutes = (mi < 10) ? '0' + mi: mi
    let s = time.getSeconds()
    let seconds = (s < 10) ? '0' + s : s

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function addLog(logContent) {
    const currentTime = new Date()
    const sqlDate = convertToSQLTime(currentTime)   // YYYY-MM-DD HH:MI:SS

    const sqlQuery = 'INSERT INTO Logs (logContent, time) VALUES (?, ?)'

    db.run(sqlQuery, [logContent, sqlDate], (error) => {
        if (error) {
            console.log('Database error:', error)
        }
    })
}

//--------------------------------------------------------------------------------------------------
// Handle access control to logged-users-only pages

app.get('/admins-dashboard.html', (req, res, next) => {
    let userData = req.cookies.userData
    if(userData && userData.email === 'admin') {
        next()
    } else {
        res.redirect('access-issue.html')
    }
})

app.get('/profile.html', (req, res, next) => {
    let userData = req.cookies.userData
    if(userData) {
        next()
    } else {
        res.redirect('access-issue.html')
    }
})

app.get('/search-friends.html', (req, res, next) => {
    let userData = req.cookies.userData
    if(userData) {
        next()
    } else {
        res.redirect('access-issue.html')
    }
})

app.get('/add-recipe.html', (req, res, next) => {
    let userData = req.cookies.userData
    if(userData) {
        next()
    } else {
        res.redirect('access-issue.html')
    }
})

app.get('/recipes-feed.html', (req, res, next) => {
    let userData = req.cookies.userData
    if(userData) {
        next()
    } else {
        res.redirect('access-issue.html')
    }
})

app.get('/recipe-display.html', (req, res, next) => {
    let userData = req.cookies.userData
    if(userData) {
        next()
    } else {
        res.redirect('access-issue.html')
    }
})

//--------------------------------------------------------------------------------------------------

// Handle root redirection
app.get('/', (req, res) => {
    // clear relevant cookies and go back to home-page
    res.redirect('/index.html')
})


// Handle logout
app.get('/logout', (req, res) => {
    if(req.cookies.userData) {
        const email = req.cookies.userData.email
        addLog(`${email} logged-out`)
    }

    // clear relevant cookies and go back to home-page
    res.clearCookie('userData')
    res.redirect('/index.html')
})

// Handle redirecting to login page when trying to go to homepage
app.get('/index.html', (req, res) => {
    res.redirect('/login.html')
})

// Handle registration request
app.post('/register', profilePicturesUpload.single('profile-picture'), (req, res) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body
    const picturePath = req.file.filename

    // validating user info
    const namePattern = /^[A-Za-z][A-Za-z- ]{0,28}[A-Za-z]$/
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        return res.status(400).json({ error: 'All fields are required.' })
    }

    if (!namePattern.test(firstName)) {
        return res.status(400).json({ error: 'Invalid first name. Names should start and end with ' +
                'letters and can include hyphens and spaces in between.' })
    }

    if (!namePattern.test(lastName)) {
        return res.status(400).json({ error: 'Invalid last name. Names should start and end with ' +
                'letters and can include hyphens and spaces in between.' })
    }

    if (!emailPattern.test(email)) {
        return res.status(400).json({ error: 'Email address is not valid.' })
    }

    if (!passwordPattern.test(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters and include at ' +
                'least 1 uppercase letter, 1 lowercase letter, and 1 number.'
        })
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' })
    }



    db.get('SELECT * FROM Users WHERE email = ?', [email], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error:' + err })
        }

        if (row) {
            return res.status(409).json({ error: 'This email address already have an account' })
        }

        const insertQuery = 'INSERT INTO Users (firstName, lastName, email, password, profilePicture) VALUES (?, ?, ?, ?, ?)'
        db.run(insertQuery, [firstName, lastName, email, password, picturePath], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' })
            }

            // Setting the cookies
            let expirationTime =  30 * 60 * 1000    // 30 minutes
            res.cookie('userData', {
                "email": email,
                "password": password
            }, {
                maxAge: expirationTime,
                httpOnly:true
            })

            addLog(`${email} registered`)

            return res.json({ message: 'Registration successful' });
        })
    })
})

// Handle information update request
app.post('/update-info', (req, res) => {

    const { firstName, lastName, email, password, confirmPassword } = req.body


    // validating user info
    const namePattern = /^[A-Za-z][A-Za-z- ]{0,28}[A-Za-z]$/
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        console.log(`first: ${firstName}, last: ${lastName}, email: ${email}, pw: ${password}, pwc: ${confirmPassword}`)
        return res.status(400).json({ error: 'All fields are required.' })
    }

    if (!namePattern.test(firstName)) {
        return res.status(400).json({ error: 'Invalid first name. Names should start and end with ' +
                'letters and can include hyphens and spaces in between.' })
    }

    if (!namePattern.test(lastName)) {
        return res.status(400).json({ error: 'Invalid last name. Names should start and end with ' +
                'letters and can include hyphens and spaces in between.' })
    }

    if (!emailPattern.test(email)) {
        return res.status(400).json({ error: 'Email address is not valid.' })
    }

    if (!passwordPattern.test(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters and include at ' +
                'least 1 uppercase letter, 1 lowercase letter, and 1 number.'
        })
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' })
    }


    const insertQuery = 'UPDATE Users ' +
        'SET firstName = ?, lastName = ?, password = ? ' +
        'WHERE email = ?'

    db.run(insertQuery, [firstName, lastName, password, email], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error: ' + err })
        }

        addLog(`${email} updated user information`)

        return res.json({ message: 'Info updated successfully' });
    })
})

// Handle profile picture update request
app.post('/update-profilePicture', profilePicturesUpload.single('edit-profile-picture'), (req, res) => {
    const picturePath = req.file.filename
    const selfEmail = req.cookies.userData.email

    const sqlQuery = 'UPDATE Users SET profilePicture = ? WHERE email = ?'

    db.run(sqlQuery, [picturePath, selfEmail], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' })
        }

        addLog(`${selfEmail} updated profile picture`)

        return res.json({ message: 'Profile picture updated successfully' });
    })
})

// Handle the attempt to load user info from cookie when login page loads
app.get('/get-cookie', (req, res) => {
    res.send(req.cookies)
})

// Handle login attempt and cookie set
app.post('/login', (req, res) => {
    const { email, password, rememberMe } = req.body

    if (!email || !password) {
        return res.status(400).json({ error: 'All fields are required' })
    }

    db.get('SELECT * FROM Users WHERE email = ? AND password = ?', [email, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' })
        }

        if (!row) {
            return res.status(409).json({ error: 'Email address or password are incorrect' })
        }

        // Setting the cookies
        let expirationTime = rememberMe ? 10 * 24 * 60 * 60 * 1000 : 30 * 60 * 1000

        res.cookie('userData', {
            "email": email,
            "password": password
        }, {
            maxAge: expirationTime,
            httpOnly:true
        })

        addLog(`${email} logged-in`)

        res.end()
    
        
    })
})

// Handle friends search
app.get('/search-friends', (req, res) => {
    const searchPrompt = req.query.prompt
    const selfEmail = req.cookies.userData.email
    const sqlPrompt = "SELECT firstName, lastName, email FROM Users WHERE (firstName LIKE ? OR lastName LIKE ?" +
        " OR email like ?) AND email <> ?"
    const likeArgument = '%' + searchPrompt + '%'
    db.all(sqlPrompt, [likeArgument, likeArgument, likeArgument, selfEmail], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' })
        }

        if (rows.length === 0) {
            return res.json({ no_result: `There are no users that match this search: '${searchPrompt}'` })
        }

        return res.json(rows)
    })
})

// Handle a request to get a list of people a user follows
app.get('/users-i-follow', (req, res) => {
    const sqlPrompt = "SELECT * FROM Follows WHERE email = ?"
    let selfEmail = req.cookies.userData.email
    db.all(sqlPrompt, [selfEmail], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' })
        }

        if (rows.length === 0) {
            return res.json({ no_result: 'You follow 0 users' })
        }

        return res.json(rows)
    })
})

// Handle request to get full name of account by its email address
app.get('/get-name-of', (req, res) => {
    const emailArgument = req.query.email
    const sqlPrompt = "SELECT firstName, lastName FROM Users WHERE email = ?"
    db.get(sqlPrompt, [emailArgument], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' })
        }

        if (!row) {
            return res.json({ no_result: `There are no users that match this email: '${emailArgument}'` })
        }

        return res.json(row)
    })
})

// Handle follow / unfollow requests
app.post('/follow', (req, res) => {
    const  { selfEmail, follows } = req.body
    const sqlQuery = 'INSERT INTO Follows (email, follows) VALUES (?, ?)'

    db.run(sqlQuery, [selfEmail, follows], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error: ' + err })
        }

        addLog(`${selfEmail} now follows ${follows}`)

        return res.json({ message: 'Follow procedure completed successfully' });
    })

})

app.post('/unfollow', (req, res) => {
    const  { selfEmail, follows } = req.body
    const sqlQuery = 'DELETE FROM Follows WHERE email = ? AND follows = ?'

    db.run(sqlQuery, [selfEmail, follows], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error: ' + err })
        }

        addLog(`${selfEmail} unfollowed ${follows}`)

        return res.json({ message: 'Unfollow procedure completed successfully' });
    })

})

// Handle request for full user information
app.get('/get-full-profile-info', (req, res) => {
    const selfEmail = req.cookies.userData.email

    const sqlQuery = 'SELECT  * FROM Users WHERE email = ?'

    db.get(sqlQuery, [selfEmail], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error:' + err })
        }

        if (!row) {
            return res.json({ no_result: 'Problem fetching this data' })
        }

        return res.json(row)
    })
})

// Handle post-recipe request
app.post('/add-recipe', recipePicturesUpload.single('recipe-picture'), (req, res) => {
    const { recipeName, foodRestrictions, dishKind, ingredients, instructions, cookingTime, sqlDate } = req.body

    console.log(foodRestrictions)
    let restrictions
    if (typeof foodRestrictions === "string") {
        if (foodRestrictions.length === 0) {
            restrictions = 'None'
        } else {
            restrictions = foodRestrictions
        }
    } else {
        restrictions = foodRestrictions.join('|')
    }

    const picturePath = req.file.filename
    const email = req.cookies.userData.email

    const insertQuery = 'INSERT INTO Recipes (email, recipeName, recipePicture, restrictions, kind, ingredients, instructions, cookingTime, time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    db.run(insertQuery, [email, recipeName, picturePath, restrictions, dishKind, ingredients, instructions, cookingTime, sqlDate], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error: ' + err })
        }

        addLog(`${email} added a recipe: ${recipeName}`)

        return res.json({ message: 'Recipe posted successfully' });
    })
})

// Handle request for getting all the recipes of users I follow or myself
app.get('/get-recipes', (req, res) => {
    const selfEmail = req.cookies.userData.email

    const  sqlQuery = 'SELECT u.firstName, u.lastName, u.email, r.id, r.recipeName, r.time, r.recipePicture, r.cookingTime, r.restrictions, r.kind ' +
        'FROM Follows f ' +
        'INNER JOIN Recipes r ON f.follows = r.email ' +
        'INNER JOIN Users u ON r.email = u.email ' +
        'WHERE f.email = ? ' +
        'UNION ' +
        'SELECT u.firstName, u.lastName, u.email, r.id, r.recipeName, r.time, r.recipePicture, r.cookingTime, r.restrictions, r.kind  ' +
        'FROM Recipes r ' +
        'INNER JOIN Users u ON r.email = u.email ' +
        'WHERE r.email = ? ' +
        'ORDER BY time DESC'

    db.all(sqlQuery, [selfEmail, selfEmail], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error:' + err })
        }

        if (rows.length === 0) {
            return res.json({ no_result: 'There are no recipes... yet.' })
        }

        return res.json(rows)
    })

})

// Handle request for getting all the recipes I uploaded
app.get('/get-my-recipes', (req, res) => {
    const selfEmail = req.cookies.userData.email

    const  sqlQuery = 'SELECT id, recipeName, recipePicture, time FROM Recipes WHERE email = ?'

    db.all(sqlQuery, [selfEmail], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error:' + err })
        }

        if (rows.length === 0) {
            return res.json({ no_result: 'You have no recipes... yet.' })
        }

        return res.json(rows)
    })

})

// Handle request for data of a specific recipe
app.get('/get-recipe-data', (req, res) => {
    const recipeId = req.query.id
    const sqlQuery = 'SELECT r.*, u.firstName, u.lastName from Recipes r INNER JOIN Users u ON r.email = u.email WHERE r.id = ?'
    db.get(sqlQuery, [recipeId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error:' + err })
        }

        if (!row) {
            return res.json({ no_result: `There are no recipes that match this id: '${id}'` })
        }

        return res.json(row)
    })
})

// Handle request for the likes count of a specific recipe
app.get('/get-recipe-likes-count', (req, res) => {
    const recipeId = req.query.id
    const sqlQuery = 'SELECT COUNT(DISTINCT email) AS count FROM Likes WHERE recipeId = ?'
    db.get(sqlQuery, [recipeId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error:' + err })
        }

        if (!row) {
            return res.json({ no_result: `There are no recipes that match this id: '${id}'` })
        }

        return res.json(row)
    })
})

// Handle like/unlike requests
app.post('/like-recipe', (req, res) => {
    const { id } = req.body
    const selfEmail = req.cookies.userData.email

    console.log(id)

    db.run('INSERT INTO Likes (email, recipeId) VALUES (?, ?)', [selfEmail, id], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' })
        }

        addLog(`${selfEmail} liked recipe #${id}`)

        return res.json({ message: 'Recipe liked successfully' });
    })
})

app.post('/unlike-recipe', (req, res) => {
    const { id } = req.body
    const selfEmail = req.cookies.userData.email

    db.run('DELETE FROM Likes WHERE email = ? AND recipeId = ?', [selfEmail, id], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' })
        }

        addLog(`${selfEmail} unliked recipe #${id}`)

        return res.json({ message: 'Recipe unliked successfully' });
    })
})

// Handle request to check if the user already likes this recipe
app.get('/check-if-i-like', (req, res) => {
    const recipeId = req.query.id
    const selfEmail = req.cookies.userData.email
    const sqlQuery = 'SELECT * FROM Likes WHERE email = ? AND recipeId = ?'
    db.get(sqlQuery, [selfEmail, recipeId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error:' + err })
        }

        if (!row) {
            return res.json({ no_result: `You don't like recipe with id: '${recipeId}'` })
        }

        return res.json(row)
    })
})

// Handle request for sharing a comment to this recipe
app.post('/share-comment', (req, res) => {
    const { sqlDate, postContent, id } = req.body
    const selfEmail = req.cookies.userData.email
    const sqlQuery = 'INSERT INTO Comments (recipeId, email, content, time) VALUES (?, ?, ?, ?)'

    db.run(sqlQuery, [id, selfEmail, postContent, sqlDate], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error: ' + err })
        }

        addLog(`${selfEmail} commented on recipe #${id}`)

        return res.json({ message: 'Comment shared successfully' })
    })
})

// Handle request to get the comments of this recipe
app.get('/get-recipe-comments', (req, res) => {
    const recipeId = req.query.id
    const  sqlQuery = 'SELECT u.firstName, u.lastName, u.email, c.content, c.time\n' +
        'FROM Users u ' +
        'INNER JOIN Comments c ON u.email = c.email ' +
        'WHERE c.recipeId = ? ' +
        'ORDER BY time DESC'

    db.all(sqlQuery, [recipeId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error:' + err })
        }

        if (rows.length === 0) {
            return res.json({ no_result: 'There are no comments... yet.' })
        }

        return res.json(rows)
    })
})

// Handle request to delete a recipe
app.delete('/delete-recipe', (req, res) => {
    const recipeId = req.query.id
    const selfEmail = req.cookies.userData.email
    const sqlQuery = 'DELETE FROM Recipes WHERE email = ? AND id = ?'
    db.run(sqlQuery, [selfEmail, recipeId], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error:' + err })
        }

        addLog(`${selfEmail} deleted their recipe #${recipeId}`)

        return res.json({ message: `Recipe #${recipeId} deleted successfully` })
    })
})

// Handle request to get all the user's followers
app.get('/get-my-followers', (req, res) => {
    const selfEmail = req.cookies.userData.email

    const sqlQuery = 'SELECT DISTINCT * ' +
        'FROM Users INNER JOIN Follows ON Users.email = Follows.email ' +
        'WHERE Follows.follows = ? ' +
        'ORDER BY Users.firstName, Users.lastName'

    db.all(sqlQuery, [selfEmail], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error:' + err })
        }

        if (rows.length === 0) {
            return res.json({ no_result: 'There are no followers... yet.' })
        }

        return res.json(rows)
    })
})

// Handle request to get all the users followed by this user
app.get('/get-my-following', (req, res) => {
    const selfEmail = req.cookies.userData.email

    const sqlQuery = 'SELECT DISTINCT Users.* ' +
        'FROM Users INNER JOIN Follows ON Users.email = Follows.follows ' +
        'WHERE Follows.email = ? ' +
        'ORDER BY Users.firstName, Users.lastName'

    db.all(sqlQuery, [selfEmail], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error:' + err })
        }

        if (rows.length === 0) {
            return res.json({ no_result: 'There are not following anyone... yet.' })
        }

        return res.json(rows)
    })
})


// Handle Admin's Dashboard requests
app.get('/get-adminView-users', (req, res) => {
    if(req.cookies.userData.email !== 'admin') {
        res.redirect('access-issue.html')
    }

    const sqlQuery = 'SELECT * FROM Users WHERE email <> "admin"'

    db.all(sqlQuery, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error:' + err })
        }

        if (rows.length === 0) {
            return res.json({ no_result: 'There are no users' })
        }

        return res.json(rows)
    })
})

app.delete('/delete-adminView-user', (req, res) => {
    if(req.cookies.userData.email !== 'admin') {
        res.redirect('access-issue.html')
    }

    const userEmail = req.query.email

    const sqlQuery = 'DELETE FROM Users WHERE email = ?'
    db.run(sqlQuery, [userEmail], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error:' + err })
        }

        addLog(`User ${userEmail} deleted by admin`)

        return res.json({ message: `User ${userEmail} deleted successfully` })
    })
})

app.get('/get-adminView-recipes', (req, res) => {
    if(req.cookies.userData.email !== 'admin') {
        res.redirect('access-issue.html')
    }

    const  sqlQuery = 'SELECT * FROM Recipes'

    db.all(sqlQuery, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error:' + err })
        }

        if (rows.length === 0) {
            return res.json({ no_result: 'There are no recipes.' })
        }

        return res.json(rows)
    })

})

app.delete('/delete-adminView-recipe', (req, res) => {
    if(req.cookies.userData.email !== 'admin') {
        res.redirect('access-issue.html')
    }

    const recipeId = req.query.id

    const sqlQuery = 'DELETE FROM Recipes WHERE id = ? ORDER BT time DESC'
    db.run(sqlQuery, [recipeId], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error:' + err })
        }

        addLog(`Recipe #${recipeId} deleted by admin`)

        return res.json({ message: `Recipe #${recipeId} deleted successfully` })
    })
})

app.get('/get-adminView-logs', (req, res) => {
    if(req.cookies.userData.email !== 'admin') {
        res.redirect('access-issue.html')
    }

    const  sqlQuery = 'SELECT * FROM Logs ORDER BY time DESC'

    db.all(sqlQuery, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error:' + err })
        }

        if (rows.length === 0) {
            return res.json({ no_result: 'There are no logs.' })
        }

        return res.json(rows)
    })

})



// ---------------------------------------------------------------------------------------
// DEV TOOLS - MUST BE DELETED BEFORE DEPLOYMENT

function deleteTable(tableName) {
    db.run(`DROP TABLE IF EXISTS ${tableName}`, (err) => {
        if(err) {
            console.log(err)
        } else {
            console.log(`${tableName} deleted`)
        }
    })
}

app.all('/dev--delete-all-tables', (req, res) => {
    deleteTable('Users')
    deleteTable('Follows')
    deleteTable('Posts')
    deleteTable('Recipes')
    deleteTable('Likes')
    deleteTable('Comments')
    deleteTable('Logs')
})

app.get('/dev--get-likes-table', (req, res) => {
    db.all('SELECT * FROM Likes', (err, rows) => {
        if(err) {
            console.log(err)
        } else {
            console.log('LIKES:', rows)
        }
    })
})

app.get('/dev--get-logs-table', (req, res) => {
    db.all('SELECT * FROM Logs', (err, rows) => {
        if(err) {
            console.log(err)
        } else {
            console.log('LOGS:', rows)
        }
    })
})


// ---------------------------------------------------------------------------------------



// Serve the static files
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'images')))

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
