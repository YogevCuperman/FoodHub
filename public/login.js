const loginForm = document.getElementById('login-form')
const message = document.getElementById('login-message')
const emailBox = document.getElementById('email')
const passwordBox = document.getElementById('password')


// if there is a cookie than the information is filled automatically
fetch('/get-cookie', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
}).then(res => res.json()).then(data => {
    if(data.userData) {
        emailBox.value = data.userData.email
        passwordBox.value = data.userData.password
    }
}).catch(err => console.error(err))



loginForm.addEventListener('submit', function (event) {
    event.preventDefault()

    const email = loginForm.email.value
    const password = loginForm.password.value
    const rememberMe = loginForm.rememberMe.checked

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, rememberMe})
    }).then(res => {
        if(res.status === 200) {
            window.location.href = 'recipes-feed.html'
        } else {
            return res.json()
        }
    }).then(data => {
        message.textContent = data.error
        console.log(data)
    }).catch(err => console.error(err))
})

document.addEventListener("DOMContentLoaded", function() {
    const urls = [
        'https://source.unsplash.com/random/1920x1080/?food',
        'https://source.unsplash.com/random/1920x1080/?cuisine',
        'https://source.unsplash.com/random/1920x1080/?dish',
        'https://source.unsplash.com/random/1920x1080/?meal',
        'https://source.unsplash.com/random/1920x1080/?dessert'
    ];

    let i = 0;

    function changeBackground() {
        // Fetch a new random image
        fetch(urls[i])
            .then((response) => {
                if (response.ok) {
                    document.body.style.backgroundImage = `url(${response.url})`;
                }
            })
            .catch((error) => {
                console.log("Error fetching image:", error);
            });

        i = (i + 1) % urls.length;
    }

    // Initially set the background
    changeBackground();

    // Change the background every 6 seconds
    setInterval(changeBackground, 6000);
});