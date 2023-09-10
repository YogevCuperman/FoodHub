const registerForm = document.getElementById('register-form')
const message = document.getElementById('register-message')

registerForm.addEventListener('submit', async function (event) {
    event.preventDefault()

    const form = event.target
    const formData = new FormData(form)

    try {
        const response = await fetch('/register', {
            method: 'POST',
            body: formData
        })
        if (response.ok) {
            const data = await response.json()
            message.textContent = data.message
            window.location.href = 'login.html'
        } else {
            const errorData = await response.json()
            message.textContent = errorData.error
        }
    } catch (error) {
        console.log('Registration error:', error)
        message.textContent = 'An error occurred during registration'
    }


})

// changing the button design after picture was chosen
document.getElementById('profile-picture').addEventListener('change', (e) => {
    const choosePictureLabel = document.getElementById('file-label')
    choosePictureLabel.style.backgroundColor = '#00B300'
    choosePictureLabel.textContent = 'Chosen picture: ' + e.target.files[0].name
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