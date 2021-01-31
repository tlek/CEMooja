const movieR = {
    Arrival: 3.4,
    Alien: 3.5,
    Amelie: 4.1,
    'In Bruges': 4.0,
    'KIll Bill': 3.9,
    Coraline: 4.2

}
for (let movie of Object.keys(movieR)) {
    console.log(movie, movieR[movie])
}