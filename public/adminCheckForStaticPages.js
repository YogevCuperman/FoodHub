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