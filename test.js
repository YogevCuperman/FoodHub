// const fetch = require('node-fetch')
const nock = require('nock')
const fs = require('fs')


const BASE_URL = "http://localhost:3000"

// defining test data:
const firstName = 'Omer'
const lastName = 'Caplan'
const email = 'omer.caplan@gmail.com'
const password = 'Aa123456'
const confirmPassword = 'Aa123456'



const routesList = [
    "GET /",
    "GET /logout",
    "GET /index.html",
    // "POST /register",
    // "POST /update-info",
    // "POST /update-profilePicture",
    "GET /get-cookie",
    "POST /login",
    // "GET /search-friends",
    // "GET /users-i-follow",
    "GET /get-name-of",
    // "POST /follow",
    // "POST /unfollow",
    // "POST /share-post",
    // "GET /get-full-profile-info",
    // "POST /add-recipe",
    // "GET /get-recipes",
    // "GET /get-my-recipes",
    "GET /get-recipe-data?id=1",
    "GET /get-recipe-likes-count?id=1",
    // "POST /like-recipe",
    // "POST /unlike-recipe",
    // "GET /check-if-i-like",
    // "POST /share-comment",
    "GET /get-recipe-comments?id=1",
    // "DELETE /delete-recipe",
    // "GET /get-my-followers",
    // "GET /get-my-following",
    // "GET /get-adminView-users",
    // "DELETE /delete-adminView-user",
    // "GET /get-adminView-recipes",
    // "DELETE /delete-adminView-recipe",
    // "GET /get-adminView-logs"
]

const routes = routesList.map(route => {
    const [method, path] = route.split(' ')
    return {
        method,
        path
    }
})

// Add body data for specific routes
routes.find(route => route.path === '/login').body = { email: email, password: password, rememberMe: true }




async function testRoute(route) {

    // Mocking responses for each route
    nock(BASE_URL)
        .intercept(route.path, route.method)
        .reply(200, { success: true })

    let options = { method: route.method };

    if (route.method === "POST") {
        options.headers = { 'Content-Type': 'application/json' }
        options.body = JSON.stringify(route.body)
    }

    let response = await fetch(BASE_URL + route.path, options)
    if (response.status >= 200 && response.status < 300) {
        console.log(`✅ ${route.method} ${route.path} - PASSED`)
    } else {
        console.log(`❌ ${route.method} ${route.path} - FAILED with status ${response.status}`)
    }


}



async function runTests() {

    console.log("Running route tests...\n")

    for (let route of routes) {
        await testRoute(route)
    }

    console.log("\nTests complete.")
}



import('node-fetch')
    .then (fetch => {
        runTests()
    })
    .catch(err => console.log(err))

