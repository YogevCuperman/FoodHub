const recipeForm = document.getElementById('add-recipe-form')
const message = document.getElementById('add-recipe-message')

recipeForm.addEventListener('submit', async function (event) {
    event.preventDefault()

    const form = event.target
    const formData = new FormData(form)
    const currentTime = new Date()
    const sqlDate = convertToSQLTime(currentTime)   // YYYY-MM-DD HH:MI:SS
    formData.set('sqlDate', sqlDate)



    const formDataJSON = {}
    formData.forEach((value, key) => {
        formDataJSON[key] = value;
    })
    //
    // console.log('DATA:', formDataJSON)



    try {
        const response = await fetch('/add-recipe', {
            method: 'POST',
            body: formData
        })
        if (response.ok) {
            const data = await response.json()
            message.textContent = data.message
            window.location.href = 'recipes-feed.html'
        } else {
            const errorData = await response.json()
            message.textContent = errorData.error
        }
    } catch (error) {
        console.log('Recipe post error:', error)
        message.textContent = 'An error occurred during attempt to post the recipe'
    }


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


// changing the button design after picture was chosen
document.getElementById('recipe-picture').addEventListener('change', (e) => {
    const choosePictureLabel = document.getElementById('recipe-picture-label')
    choosePictureLabel.style.backgroundColor = '#00B300'
    choosePictureLabel.textContent = 'Chosen picture: ' + e.target.files[0].name
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



/*  MAIN  */

checkAdminPermissions()