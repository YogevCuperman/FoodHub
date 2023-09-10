const tabContents = document.querySelectorAll('.tab-content')
const tabButtons = document.querySelectorAll('.tab-header')

const usersList = document.getElementById('admin--users-list')
const recipesList = document.getElementById('admin--recipes-list')
const logsList = document.getElementById('admin--logs-list')



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


// functions for Followers tab
function createUsersListItem(data) {
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

    const deleteButton = document.createElement('button')
    deleteButton.className = 'feed-itemButton'
    deleteButton.textContent = 'Delete user'
    deleteButton.style.backgroundColor = '#ce0f0f'
    deleteButton.addEventListener('click', () => {
        fetch(`/delete-adminView-user?email=${email}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log(data)
                updateUsersList()
            })
            .catch(err => console.log(err))
    })

    const buttonsDiv = document.createElement('div')
    buttonsDiv.className = 'feed-itemButtonsDiv'
    buttonsDiv.appendChild(deleteButton)


    const contentDiv = document.createElement('div')
    contentDiv.className = 'feed-itemContent'
    contentDiv.appendChild(profileImg)
    contentDiv.appendChild(textDiv)
    contentDiv.appendChild(buttonsDiv)

    const item = document.createElement('li')
    item.className = 'profile--followers-item'
    item.appendChild(contentDiv)

    usersList.appendChild(item)

    const separator = document.createElement('hr')
    usersList.appendChild(separator)


}

function updateUsersList() {
    usersList.innerHTML = ''

    fetch('/get-adminView-users', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .then(data => {
            if(data.length > 0) {
                for (let i = 0; i < data.length; i++) {
                    createUsersListItem(data[i])
                }

                // remove the last separator added to the feed list
                usersList.removeChild(usersList.lastChild)
            } else {
                usersList.textContent = 'There are no users'
            }
        })
        .catch(err => console.error(err))
}


// functions for Recipes tab
function createRecipesListItem(data) {
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
        fetch(`/delete-adminView-recipe?id=${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                updateRecipesList()
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

    recipesList.appendChild(item)

    const separator = document.createElement('hr')
    recipesList.appendChild(separator)


}

function updateRecipesList() {
    recipesList.innerHTML = ''

    fetch('/get-adminView-recipes', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .then(data => {
            if(data.length > 0) {
                for (let i = 0; i < data.length; i++) {
                    createRecipesListItem(data[i])
                }

                // remove the last separator added to the feed list
                recipesList.removeChild(recipesList.lastChild)
            } else {
                recipesList.textContent = 'There are no recipes'
            }
        })
        .catch(err => console.error(err))
}


// functions for Logs tab

function createLogsListItem(data) {
    const { logContent, time } = data
    const timeComponents = timeComponentsFromSQL(time)

    const dateLabel = document.createElement('label')
    dateLabel.className = 'regular-label'
    dateLabel.innerText = timeComponents.date

    const timeLabel = document.createElement('label')
    timeLabel.className = 'regular-label'
    timeLabel.innerText = timeComponents.time

    const contentPar = document.createElement('p')
    contentPar.className = 'feed-commentContent'
    contentPar.innerText = logContent

    const infoDiv = document.createElement('div')
    infoDiv.className = 'feed-infoDiv'


    const timeDiv = document.createElement('div')
    timeDiv.className = 'feed-timeDiv'
    timeDiv.appendChild(dateLabel)
    timeDiv.appendChild(timeLabel)

    const headerDiv = document.createElement('div')
    headerDiv.className = 'feed-itemHeader'
    headerDiv.appendChild(infoDiv)
    headerDiv.appendChild(timeDiv)

    const item = document.createElement('li')
    item.className = 'comment-item'
    item.appendChild(headerDiv)
    item.appendChild(contentPar)

    logsList.appendChild(item)

    const separator = document.createElement('hr')
    logsList.appendChild(separator)
}

function updateLogsList() {
    logsList.innerHTML = ''

    fetch('/get-adminView-logs', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .then(data => {
            if(data.length > 0) {
                for (let i = 0; i < data.length; i++) {
                    createLogsListItem(data[i])
                }

                // remove the last separator added to the feed list
                logsList.removeChild(logsList.lastChild)
            } else {
                logsList.textContent = 'There are no logs'
            }
        })
        .catch(err => console.error(err))
}


//------------------------------------------------------------------------------------------------

/*  MAIN  */

// update navbar for admin
checkAdminPermissions()

// set the users list
updateUsersList()

// set the recipes list
updateRecipesList()

// set the logs list
updateLogsList()


// setting the logs tab as the active one when page loads
showTab(tabContents.length - 1)