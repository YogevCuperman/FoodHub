const picture = document.getElementById('profile-picture-img')
const nameLabel = document.getElementById('user-name-label')
const emailLabel = document.getElementById('email-label')

const tabContents = document.querySelectorAll('.tab-content');
const tabButtons = document.querySelectorAll('.tab-header');

const myRecipeList = document.getElementById('profile--myRecipe-list')
const followersList = document.getElementById('profile--followers-list')
const followingList = document.getElementById('profile--following-list')

const editPictureForm = document.getElementById('profile--editPicture-form')
const editInfoForm = document.getElementById('profile--editInfo-form')
const message = document.getElementById('edit-info-message')


//------------------------------------------------------------------------------------------------

/*  FUNCTIONS AND EVENTS  */

// update navbar for admin
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

// get the user information
function fetchInfo() {
        fetch('/get-full-profile-info')
            .then(res => res.json())
            .then(data => {
                    const picturePath = '/profilePictures/' + data.profilePicture
                    const fullName = data.firstName + " " + data.lastName

                    picture.setAttribute('src', picturePath)
                    nameLabel.textContent = fullName
                    emailLabel.textContent = data.email
            }).catch(err => console.error(err))
}


// event handler for the tab buttons
function showTab(tabIndex) {
        tabContents.forEach(content => content.classList.remove('active'));
        tabButtons.forEach(content => content.classList.remove('active'));
        tabContents[tabIndex].classList.add('active');
        tabButtons[tabIndex].classList.add('active');
}

// time parsing method
function timeComponentsFromSQL(sqlTime) {
    const breakDateAndTime = sqlTime.split(' ')
    const date = breakDateAndTime[0].split('-')
    const time = breakDateAndTime[1].split(':')

    return {
        'date': `${date[2]}/${date[1]}/${date[0]}`,
        'time': `${time[0]}:${time[1]}`
    }
}


// functions for My Recipes tab
function createMyRecipesListItem(data) {
    const { id, recipeName, recipePicture } = data
    const timeComponents = timeComponentsFromSQL(data.time)


    const dateLabel = document.createElement('label')
    dateLabel.className = 'smaller-label'
    dateLabel.innerText = timeComponents.date

    const recipeImg = document.createElement('img')
    recipeImg.setAttribute('src', 'recipePictures/' + recipePicture)
    recipeImg.setAttribute('alt', recipeName)
    recipeImg.className = 'feed-picture'

    const recipeNamePar = document.createElement('p')
    recipeNamePar.className = 'feed-itemName'
    recipeNamePar.innerText = recipeName

    const recipeText = document.createElement('div')
    recipeText.className = 'feed-itemText'
    recipeText.appendChild(recipeNamePar)
    recipeText.appendChild(dateLabel)

    const gotoButton = document.createElement('button')
    gotoButton.className = 'feed-itemButton'
    gotoButton.textContent = 'Go to recipe'
    gotoButton.addEventListener('click', () => {
        window.location.href = `recipe-display.html?id=${id}`
    })

    const deleteButton = document.createElement('button')
    deleteButton.className = 'feed-itemButton'
    deleteButton.textContent = 'Delete'
    deleteButton.style.backgroundColor = '#ce0f0f'
    deleteButton.addEventListener('click', () => {
        fetch(`/delete-recipe?id=${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log(data)
                updateMyRecipeList()
            })
            .catch(err => console.log(err))
    })

    const recipeButtons = document.createElement('div')
    recipeButtons.className = 'feed-itemButtonsDiv'
    recipeButtons.appendChild(gotoButton)
    recipeButtons.appendChild(deleteButton)

    const contentDiv = document.createElement('div')
    contentDiv.className = 'feed-itemContent'
    contentDiv.appendChild(recipeImg)
    contentDiv.appendChild(recipeText)
    contentDiv.appendChild(recipeButtons)

    const item = document.createElement('li')
    item.className = 'profile--myRecipes-item'
    item.appendChild(contentDiv)

    myRecipeList.appendChild(item)


}

function updateMyRecipeList() {
   myRecipeList.innerHTML = ''

    fetch('/get-my-recipes', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .then(data => {
            if(data.length > 0) {
                for (let i = 0; i < data.length; i++) {
                    console.log(data[i])
                    createMyRecipesListItem(data[i])
                }
            } else {
                myRecipeList.textContent = 'You have no recipes... yet'
            }
        })
        .catch(err => console.error(err))
}


// functions for Followers tab
function createFollowersListItem(data) {
    const { email, firstName, lastName, profilePicture } = data

    const profileImg = document.createElement('img')
    profileImg.setAttribute('src', 'profilePictures/' + profilePicture)
    profileImg.setAttribute('alt', profilePicture)
    profileImg.className = 'feed-picture'

    const followerNamePar = document.createElement('p')
    followerNamePar.className = 'feed-itemName'
    followerNamePar.innerText = firstName + " " + lastName

    const followerEmail = document.createElement('label')
    followerEmail.className = 'smaller-label'
    followerEmail.textContent = email

    const textDiv = document.createElement('div')
    textDiv.className = 'feed-itemText'
    textDiv.appendChild(followerNamePar)
    textDiv.appendChild(followerEmail)


    const contentDiv = document.createElement('div')
    contentDiv.className = 'feed-itemContent'
    contentDiv.appendChild(profileImg)
    contentDiv.appendChild(textDiv)

    const item = document.createElement('li')
    item.className = 'profile--followers-item'
    item.appendChild(contentDiv)

    followersList.appendChild(item)

}

function updateFollowersList() {
    followersList.innerHTML = ''

    fetch('/get-my-followers', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .then(data => {
            if(data.length > 0) {
                for (let i = 0; i < data.length; i++) {
                    createFollowersListItem(data[i])
                }
            } else {
                followersList.textContent = 'You have no followers... yet'
            }
        })
        .catch(err => console.error(err))
}


// functions for Following tab
function createFollowingListItem(data) {
    const { email, firstName, lastName, profilePicture } = data

    const profileImg = document.createElement('img')
    profileImg.setAttribute('src', 'profilePictures/' + profilePicture)
    profileImg.setAttribute('alt', profilePicture)
    profileImg.className = 'feed-picture'

    const followerNamePar = document.createElement('p')
    followerNamePar.className = 'feed-itemName'
    followerNamePar.innerText = firstName + " " + lastName

    const followerEmail = document.createElement('label')
    followerEmail.className = 'smaller-label'
    followerEmail.textContent = email

    const textDiv = document.createElement('div')
    textDiv.className = 'feed-itemText'
    textDiv.appendChild(followerNamePar)
    textDiv.appendChild(followerEmail)

    const unfollowBtn = document.createElement('button')
    unfollowBtn.textContent = 'Unfollow'
    unfollowBtn.className = 'feed-itemButton'
    unfollowBtn.style.backgroundColor = '#ce0f0f'
    unfollowBtn.addEventListener('click', () => {
        fetch('get-cookie')
            .then(res => res.json())
            .then(data => {
                const selfEmail = data.userData.email
                let follows = email
                fetch('/unfollow', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({selfEmail, follows})
                })
                    .then(res => res.json())
                    .then(data => {
                        console.log(data)
                        updateFollowingList()
                    })
                    .catch(err => console.error(err))
            })
            .catch(err => console.log(err))
    })


    const contentDiv = document.createElement('div')
    contentDiv.className = 'feed-itemContent'
    contentDiv.appendChild(profileImg)
    contentDiv.appendChild(textDiv)
    contentDiv.appendChild(unfollowBtn)

    const item = document.createElement('li')
    item.className = 'profile--followers-item'
    item.appendChild(contentDiv)

    followingList.appendChild(item)

}

function updateFollowingList() {
    followingList.innerHTML = ''

    fetch('/get-my-following', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .then(data => {
            if(data.length > 0) {
                for (let i = 0; i < data.length; i++) {
                    createFollowingListItem(data[i])
                }

            } else {
                followingList.textContent = 'You are not following anyone... yet'
            }
        })
        .catch(err => console.error(err))
}


// functions for Edit Information tab
function setInfoToChange() {
    fetch('/get-full-profile-info')
        .then(res => res.json())
        .then(data => {
            const { email, firstName, lastName, password, profilePicture } = data
            editInfoForm.querySelector('#editFirstName').value = firstName
            editInfoForm.querySelector('#editLastName').value = lastName
            editInfoForm.querySelector('#editEmail').value = email
            editInfoForm.querySelector('#editPassword').value = password
        })
        .catch(err => console.log(err))
}

document.getElementById('edit-profile-picture').addEventListener('change', (e) => {
    const choosePictureLabel = document.getElementById('edit-file-label')
    choosePictureLabel.style.backgroundColor = '#00B300'
    choosePictureLabel.textContent = 'Chosen picture: ' + e.target.files[0].name
})

editPictureForm.addEventListener('submit', async function (event) {
    event.preventDefault()

    const form = event.target
    const formData = new FormData(form)

    try {
        const response = await fetch('/update-profilePicture', {
            method: 'POST',
            body: formData
        })
        if (response.ok) {
            const data = await response.json()
            message.textContent = data.message
            window.location.href = 'profile.html'
        } else {
            const errorData = await response.json()
            message.textContent = errorData.error
        }
    } catch (error) {
        console.log('Update info error:', error)
        message.textContent = 'An error occurred during updating profile picture'
    }


})

editInfoForm.addEventListener('submit', async function (event) {
    event.preventDefault()

    const firstName = document.getElementById('editFirstName').value
    const lastName = document.getElementById('editLastName').value
    const email = document.getElementById('editEmail').value
    const password = document.getElementById('editPassword').value
    const confirmPassword = document.getElementById('editConfirmPassword').value

    try {
        const response = await fetch('/update-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({firstName, lastName, email, password, confirmPassword})
        })
        if (response.ok) {
            const data = await response.json()
            message.textContent = data.message
            window.location.href = 'profile.html'
        } else {
            const errorData = await response.json()
            message.textContent = errorData.error
        }
    } catch (error) {
        console.log('Update info error:', error)
        message.textContent = 'An error occurred during updating information'
    }


})

//------------------------------------------------------------------------------------------------

/*  MAIN  */

// update navbar for admin
checkAdminPermissions()

// set the information of the current user
fetchInfo()

// set the recipes the user posted list
updateMyRecipeList()

// set the followers list
updateFollowersList()

// set the following list
updateFollowingList()

// set the Edit Information tab components
setInfoToChange()

// setting the first tab as the active onw when page loads
tabContents[0].classList.add('active')
tabButtons[0].classList.add('active')