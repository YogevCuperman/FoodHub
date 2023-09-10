const picture = document.getElementById('recipe-picture-img')
const recipeDisplayName = document.getElementById('recipe-name-label')
const authorEmail = document.getElementById('author-email-label')
const postDate = document.getElementById('post-date-label')
const detail_cookingTime = document.getElementById('detail-cookingTime')
const detail_dishKind = document.getElementById('detail-dishKind')
const detail_restrictions = document.getElementById('detail-restrictions')
const detail_ingredients = document.getElementById('detail-ingredients')
const detail_instructions = document.getElementById('detail-instructions')
const likesCounter = document.getElementById('likes-counter-span')
const likeButton = document.getElementById('recipe-like-button')
const commentInput = document.getElementById('recipe-comment-input')
const shareCommentButton = document.getElementById('recipe-comment-share')
const commentsList = document.getElementById('comments-list')

const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
const id = urlParams.get('id')

//--------------------------------------------------------------------------------

/* FUNCTIONS AND EVENTS */

// getting the data of the relevant recipe
function fetchRecipeData() {
    fetch(`/get-recipe-data?id=${id}`, {
        method: 'GET'
    })
        .then(res => res.json())
        .then(data => {
            const { cookingTime, email, ingredients, instructions, kind, recipeName, recipePicture, restrictions, time, firstName, lastName } = data
            const separatedRestrictions = restrictions.split('|').join(', ')

            picture.setAttribute('src', 'recipePictures/' + recipePicture)
            recipeDisplayName.textContent = recipeName

            const authorName = firstName + ' ' + lastName
            authorEmail.textContent = `${authorName}`

            const date = timeComponentsFromSQL(time).date
            postDate.textContent = date

            detail_cookingTime.textContent = cookingTime + ' minutes'
            detail_dishKind.textContent = kind
            if(restrictions.length > 0) {
                detail_restrictions.textContent = separatedRestrictions
            } else {
                document.getElementById('detail-removable').textContent = ""
            }

            detail_ingredients.textContent = ingredients
            detail_instructions.textContent = instructions
        })
        .catch(err => console.log(err))
}

function likeButtonClickHandle() {
    if (likeButton.textContent === 'Like') {
        fetch('/like-recipe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id})
        })
            .then(res => res.json())
            .then(data => {
                console.log(data)
                refreshLikesCounter()
                // likeButton.style.backgroundColor = '#d02a2a'
                likeButton.textContent = 'Unlike'
            })
            .catch(err => console.log(err))
    } else {
        fetch('/unlike-recipe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id})
        })
            .then(res => res.json())
            .then(data => {
                console.log(data)
                refreshLikesCounter()
                // likeButton.style.backgroundColor = '#00b300'
                likeButton.textContent = 'Like'
            })
            .catch(err => console.log(err))
    }
}

likeButton.addEventListener('click', likeButtonClickHandle)

function refreshLikesCounter() {
    fetch(`/get-recipe-likes-count?id=${id}`, {
        method: 'GET'
    })
        .then(res => res.json())
        .then(data => {
            likesCounter.textContent = `This recipe has ${data.count} likes`
        })
        .catch(err => console.log(err))
}


// checking if the current user already likes this recipe and updates the like button accordingly
function testAndSetMyLike() {
    fetch(`/check-if-i-like?id=${id}`, {
        method: 'GET'
    })
        .then(res => res.json())
        .then(data => {
            if(data.no_result) {
                // user doesn't like this recipe yet
                likeButton.classList.remove('liked')
                likeButton.textContent = 'Like'
            } else {
                // user already likes this recipe
                likeButton.classList.add('liked')
                likeButton.textContent = 'Unlike'
            }
        })
        .catch(err => console.log(err))
}

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

function timeComponentsFromSQL(sqlTime) {
    const breakDateAndTime = sqlTime.split(' ')
    const date = breakDateAndTime[0].split('-')
    const time = breakDateAndTime[1].split(':')

    return {
        'date': `${date[2]}/${date[1]}/${date[0]}`,
        'time': `${time[0]}:${time[1]}`
    }
}

function createListItem(data) {
    const { content } = data
    const writer = data.firstName + ' ' + data.lastName

    const nameLabel = document.createElement('label')
    nameLabel.className = 'name-label'
    nameLabel.innerText = writer

    const contentPar = document.createElement('p')
    contentPar.className = 'comment-content'
    contentPar.innerText = content

    const item = document.createElement('li')
    item.className = 'comment-item'
    item.appendChild(nameLabel)
    item.appendChild(contentPar)

    commentsList.appendChild(item)

}

function updateCommentsList() {
    commentsList.innerHTML = ''

    fetch(`/get-recipe-comments?id=${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .then(data => {
            if(data.no_result) {
                commentsList.textContent = data.no_result
            } else {
                for (let i = 0; i < data.length; i++) {
                    createListItem(data[i])
                }

            }
        })
        .catch(err => console.error(err))


}

function shareCommentButtonHandler() {
    const currentTime = new Date()
    const sqlDate = convertToSQLTime(currentTime)   // YYYY-MM-DD HH:MI:SS

    const postContent = commentInput.value


    fetch('/share-comment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({sqlDate, postContent, id})
    })
        .then(res => res.json())
        .then(data => {
            updateCommentsList()    // refresh the list after posting
            commentInput.value = ''
        })
        .catch(err => console.error(err))
}

shareCommentButton.addEventListener('click', shareCommentButtonHandler)

function checkAdminPermissions() {
    fetch('/get-cookie')
        .then(res => res.json())
        .then(data => {
            if (data.userData.email === 'admin') {
                const permissions = document.getElementsByClassName("admin-permission")
                for (let i = 0; i < permissions.length; i++) {
                    permissions[i].removeAttribute("hidden")
                }
            }
        })
        .catch(error => console.log(error))
}

document.getElementById('recipe-like-button').addEventListener('click', function() {
    this.classList.toggle('liked');
})

//--------------------------------------------------------------------------------


/* MAIN */

checkAdminPermissions()
testAndSetMyLike()
refreshLikesCounter()
fetchRecipeData()
updateCommentsList()