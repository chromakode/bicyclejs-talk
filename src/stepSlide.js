import xs from 'xstream'

export default function stepSlide({slug, view, steps}) {
  const slides = steps.map((step, idx) => {
    idx++
    const slideContent = steps.slice(0, idx)
    return {
      slug: `${slug}-${idx}`,
      main: () => ({ DOM: xs.of(view(slideContent)) }),
    }
  })
  slides.unshift({
    slug: slug,
    main: () => ({ DOM: xs.of(view()) }),
  })
  return slides
}
