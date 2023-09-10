const shareButton = document.getElementById('post-recipe-button')
const feedList = document.getElementById('recipe-feed-list')


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
    const { email, id, recipeName, recipePicture, cookingTime, restrictions, kind } = data
    const writer = data.firstName + ' ' + data.lastName
    const timeComponents = timeComponentsFromSQL(data.time)
    const separatedRestrictions = restrictions.split('|').join(', ')

    const nameLabel = document.createElement('label')
    nameLabel.className = 'regular-label'
    nameLabel.innerText = writer

    const dateLabel = document.createElement('label')
    dateLabel.className = 'regular-label'
    dateLabel.innerText = timeComponents.date

    const timeLabel = document.createElement('label')
    timeLabel.className = 'regular-label'
    timeLabel.innerText = timeComponents.time

    const recipeImg = document.createElement('img')
    recipeImg.setAttribute('src', 'recipePictures/' + recipePicture)
    recipeImg.setAttribute('alt', recipeName)
    recipeImg.className = 'feed-picture'

    const recipeNamePar = document.createElement('p')
    recipeNamePar.className = 'feed-itemName'
    recipeNamePar.innerText = recipeName

    const cookingTimeIndicator = document.createElement('h5')
    cookingTimeIndicator.textContent = `Cooking time: ${cookingTime} minutes`

    const kindIndicator = document.createElement('h5')
    kindIndicator.textContent = `Dish kind: ${kind}`

    const restrictionsIndicator = document.createElement('h5')
    restrictionsIndicator.textContent = `Food restrictions: ${separatedRestrictions}`
    console.log(restrictions.value)

    const recipeDetails = document.createElement('div')
    recipeDetails.className = 'feed-itemDetails'
    recipeDetails.appendChild(cookingTimeIndicator)
    recipeDetails.appendChild(kindIndicator)
    recipeDetails.appendChild(restrictionsIndicator)

    const recipeText = document.createElement('div')
    recipeText.className = 'feed-itemText'
    recipeText.appendChild(recipeNamePar)
    recipeText.appendChild(recipeDetails)

    const likesCounter = document.createElement('label')
    likesCounter.className = 'regular-label'
    fetch(`/get-recipe-likes-count?id=${id}`)
        .then(res => res.json())
        .then(data => {
            likesCounter.textContent = data.count + ' likes'
        })
        .catch(err => console.log(err))

    const gotoButton = document.createElement('button')
    gotoButton.className = 'feed-itemButton'
    gotoButton.textContent = 'Go to recipe'
    gotoButton.addEventListener('click', () => {
        window.location.href = `recipe-display.html?id=${id}`
    })

    const recipeButtons = document.createElement('div')
    recipeButtons.className = 'feed-itemButtonsDiv'
    recipeButtons.appendChild(likesCounter)
    recipeButtons.appendChild(gotoButton)

    const contentDiv = document.createElement('div')
    contentDiv.className = 'feed-itemContent'
    contentDiv.appendChild(recipeImg)
    contentDiv.appendChild(recipeText)
    contentDiv.appendChild(recipeButtons)

    const infoDiv = document.createElement('div')
    infoDiv.className = 'feed-infoDiv'
    infoDiv.appendChild(nameLabel)

    const timeDiv = document.createElement('div')
    timeDiv.className = 'feed-timeDiv'
    timeDiv.appendChild(dateLabel)
    timeDiv.appendChild(timeLabel)

    const headerDiv = document.createElement('div')
    headerDiv.className = 'feed-itemHeader'
    headerDiv.appendChild(infoDiv)
    headerDiv.appendChild(timeDiv)

    const item = document.createElement('li')
    item.className = 'feed-item'
    item.appendChild(headerDiv)
    item.appendChild(contentDiv)

    feedList.appendChild(item)

}

function updateList() {
    feedList.innerHTML = ''

    fetch('/get-recipes', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .then(data => {
            console.log(data)
            for (let i = 0; i < data.length; i++) {
                createListItem(data[i])
            }
        })
        .catch(err => console.error(err))
}

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


shareButton.addEventListener('click', () => {
    window.location.href = 'add-recipe.html'
})


// updating navbar if the user is the admin
checkAdminPermissions()

// updating the feed list on page load
updateList()