(() => {
  const PERMUTATIONS = [
    'LLRLLRLR',
    'LLRLRLRR',
    'LLRLRRLR',
    'LLRRLLRR',
    'LLRRLRLR',
    'LRLRRLRR',
    'LLLRLLLR',
    'LLLRLLRR',
    'LLLRLRLR',
    'LLLRLRRR',
    'LLLRRLLR',
    'LLLRRLRR',
    'LLLRRRLR',
    'LLRLLRRR',
    'LLRRLRRR',
    'LLRRRLRR',
    'LRLRLRRR',
    'LRRRLRRR',
    'LLLLRLLR',
    'LLLLRLRR',
    'LLLLRRLR',
    'LLLLRRRR',
    'LLRLRRRR',
    'LLRRRRLR',
    'LRRLRRRR',
    'LLLLLRLR',
    'LLLLLRRR',
    'LLLRRRRR',
    'LRLRRRRR',
    'LLLLLLRR',
    'LLRRRRRR',
    'LLLLLLLR',
    'LRRRRRRR',
  ]

  const PERMUTATIONS_OFFSETS = {
    [2]: 6,
    [3]: 18,
    [4]: 25,
    [5]: 29,
    [6]: 31,
    [7]: 33
  }

  const UINT32_MAX = 4294967295

  function mapRange (value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1))
  }

  function rotateArrayInPlace (array, rotation) {
    array.push.apply(array, array.splice(0, rotation));
  }

  function renderSeed (randomSeed, maxStrokes) {
    const permutations = PERMUTATIONS.slice(0, PERMUTATIONS_OFFSETS[maxStrokes])

    const encoder = new TextEncoder()
    const buffer = encoder.encode(randomSeed).buffer

    return crypto.subtle.digest('SHA-256', buffer)
      .then(key => {
        const algo = {name: 'HMAC', hash: 'SHA-256'}
        return crypto.subtle.importKey('raw', key, algo, false, ['sign'])
      }).then(key => {
        Promise.all([...document.querySelectorAll('#exercises .exercise')]
          .map((svg, index) => {

            const counter = new Uint32Array(1)
            counter[0] = index

            return crypto.subtle.sign({name: 'HMAC'}, key, counter)
              .then(randomBlock => {
                const array = new Uint32Array(randomBlock)

                const permutationIndex =
                  Math.floor(mapRange(array[0], 0, UINT32_MAX, 0, permutations.length))
                const rotation = Math.floor(mapRange(array[1], 0, UINT32_MAX, 0, 8))

                const strokes = permutations[permutationIndex].split('')
                rotateArrayInPlace(strokes, rotation)

                const textLayer = svg.contentDocument.getElementById('svgStrokeText')
                for (i in strokes) {
                  textLayer.children[i].innerHTML = strokes[i]
                }
              })
          })
        )
      })
  }

  function queryString (params) {
    const query = new URLSearchParams(params)
    return query.toString()
  }

  function newRandomSeed () {
    const seedLength = 8
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const seed = []
    for (let i = 0; i < seedLength; i++) {
      seed.push(chars.charAt(Math.floor(Math.random() * chars.length)))
    }
    return seed.join('')
  }

  const randomizeForm = document.getElementById('randomizeForm')
  randomizeForm.onsubmit = (e) => {
    e.preventDefault()

    const randomSeed = newRandomSeed()
    const maxStrokes = e.target.maxStrokes.value

    history.pushState({randomSeed, maxStrokes}, '', '?' + queryString({
      s: randomSeed,
      m: maxStrokes
    }))
    renderSeed(randomSeed, maxStrokes)
  }

  const exercisesRoot = document.getElementById('exercises')
  for (let i = 0; i < 8; i++) {
    const object = document.createElement('object')
    object.type = 'image/svg+xml'
    object.data = 'assets/exercise.svg'
    object.className = 'exercise'
    const div = document.createElement('div')
    div.appendChild(object)
    exercisesRoot.appendChild(div)
  }

  window.onpopstate = (event) => {
    const {randomSeed, maxStrokes} = event.state
    renderSeed(randomSeed, maxStrokes)
  }

  window.onload = () => {
    const params = new URLSearchParams(window.location.search)
    const randomSeed = params.get('s')
    const maxStrokes = params.get('m')

    if (randomSeed && maxStrokes) {
      renderSeed(randomSeed, maxStrokes)
    } else {
      const randomSeed = newRandomSeed()
      const maxStrokes = 3
      history.replaceState(randomSeed, '', '?' + queryString({
        s: randomSeed,
        m: maxStrokes
      }))
      renderSeed(randomSeed, maxStrokes)
    }
  }
})()
