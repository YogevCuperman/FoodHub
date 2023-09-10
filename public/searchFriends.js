const textBox = document.getElementById("search-friends-box")
const searchButton = document.getElementById("search-friends-button")
const list = document.getElementById("search-friends-list")


searchButton.addEventListener('click', handleSearch)

textBox.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { // Enter key
        event.preventDefault(); // Prevent form submission
        searchButton.click(); // Trigger button's click event
    }
})

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

function handleSearch() {
    let searchPrompt = document.getElementById("search-friends-box").value
    let url = `/search-friends?prompt=${searchPrompt}`
    let selfEmail
    let alreadyFollows = []
    let selfWasInResults = false

    // request for self-email
    fetch('/get-cookie', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .then(data => {
            if(data.userData) {
                selfEmail = data.userData.email
            }
        }).catch(err => console.error(err))

    // request for people I follow
    fetch('/users-i-follow', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .then(data => {
            if (!data.no_result) {
                for(let i = 0; i < data.length; i++) {
                    alreadyFollows.push(data[i].follows)
                }
            }
        })
        .catch(err => console.error(err))

    // request for all users that match the search prompt
    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.no_result) {
                list.innerText = data.no_result
            } else {
                list.innerText = ""
                for (let i = 0; i < data.length; i++) {
                    let email = data[i].email
                    if(email === selfEmail) {
                        // We don't want the search list to show ourselves
                        selfWasInResults = true
                        continue
                    }

                    // Creating an element for each search result
                    const item = document.createElement("li")
                    item.className = "search-result-item"
                    const nameLabel = document.createElement("label")
                    nameLabel.className = "item-username"
                    const address = document.createElement("label")
                    address.innerText = email
                    address.className = 'item-email'
                    const follow = document.createElement("button")
                    follow.className = 'liking-button'
                    follow.innerText = "Follow"
                    const unfollow = document.createElement("button")
                    unfollow.className = 'liking-button'
                    unfollow.innerText = "Unfollow"

                    // getting the full name of this user
                    let fullName
                    fetch(`/get-name-of?email=${email}`)
                        .then(res => res.json())
                        .then(respData => {
                            fullName = respData.firstName + " " + respData.lastName
                            nameLabel.innerText = fullName
                        })
                        .catch(e => console.error(e))


                    const buttons = document.createElement("div")
                    buttons.className = 'buttons-div'
                    buttons.appendChild(follow)
                    buttons.appendChild(unfollow)
                    item.appendChild(nameLabel)
                    item.appendChild(address)
                    item.appendChild(buttons)
                    list.appendChild(item)

                    if(i < data.length - 1) {
                        const separator = document.createElement("hr")
                        list.appendChild(separator)
                    }

                    follow.addEventListener('click', () => {
                        let follows = email
                        fetch('/follow', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({selfEmail, follows})
                        })
                            .then(res => res.json())
                            .then(data => {
                                if (!data.err) {
                                    follow.disabled = true
                                    unfollow.disabled = false
                                }
                            })
                            .catch(err => console.error(err))
                    })


                    unfollow.addEventListener('click', () => {
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
                                if (!data.err) {
                                    follow.disabled = false
                                    unfollow.disabled = true
                                }
                            })
                            .catch(err => console.error(err))
                    })

                    if (alreadyFollows.includes(email)) {
                        follow.disabled = true
                        unfollow.disabled = false
                    } else {
                        follow.disabled = false
                        unfollow.disabled = true
                    }
                }

                // removing the separator line from the bottom of the list
                if(selfWasInResults && list.lastChild.nodeName === "HR") {
                    list.removeChild(item.lastChild)
                }

            }
            document.getElementById('feed-search-results-container').removeAttribute('hidden')
        })
        .catch(err => console.error(err))
}


/*  MAIN  */

checkAdminPermissions()
