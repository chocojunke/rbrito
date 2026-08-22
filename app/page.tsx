import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { About } from '@/components/about'
import { Works } from '@/components/works'
import { Location } from '@/components/location'
import { Contact } from '@/components/contact'
import { SiteFooter } from '@/components/site-footer'

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <About />
        <Works />
        <Location />
        <Contact />
      </main>
      <SiteFooter />
    </>
  )
}
