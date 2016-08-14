import xs from 'xstream'

export default function simpleSlide({slug, view}) {
  return {
    slug,
    main: () => ({ DOM: xs.of(view) }),
  }
}

