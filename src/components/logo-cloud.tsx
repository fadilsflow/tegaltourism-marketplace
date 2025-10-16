import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import Image from 'next/image'

export default function LogoCloud() {
    return (
        <section className="bg-background overflow-hidden py-16">
            <div className="group relative container mx-auto px-6 md:px-12">
                <div className="flex flex-col items-center md:flex-row">
                    <div className="md:max-w-44 md:border-r md:pr-6">
                        <p className="text-end text-sm">Kerja Sama dengan</p>
                    </div>
                    <div className="relative py-6 md:w-[calc(100%-11rem)]">
                        <InfiniteSlider
                            speedOnHover={20}
                            speed={40}
                            gap={112}>

                            <div className="flex">
                                <Image
                                    className="mx-auto h-12 w-fit dark:invert"
                                    src="/kerja-sama/logo_harkat.png"
                                    alt="Lebah Rembulan Logo"
                                    height="40"
                                    width="40"
                                />
                            </div>
                            <div className="flex">
                                <Image
                                    className="mx-auto h-12 w-fit dark:invert"
                                    src="/kerja-sama/logo_lembah_rembulan.png"
                                    alt="Lebah Rembulan Logo"
                                    height="40"
                                    width="40"
                                />
                            </div>
                            <div className="flex">
                                <Image
                                    className="mx-auto h-12 w-fit dark:invert"
                                    src="/kerja-sama/logo_waduk_cacaban.jpg"
                                    alt="Waduk Cacaban Logo"
                                    height="40"
                                    width="40"
                                />
                            </div>
                            <div className="flex">
                                <Image
                                    className="mx-auto h-12 w-fit dark:invert"
                                    src="/kerja-sama/logo_karang_cengis.jpg"
                                    alt="Karang Cengis Logo"
                                    height="40"
                                    width="40"
                                />
                            </div>
                            <div className="flex">
                                <Image
                                    className="mx-auto h-12 w-fit dark:invert"
                                    src="/kerja-sama/logo_museum_semedo.jpg"
                                    alt="Museum Semedol Logo"
                                    height="40"
                                    width="40"
                                />
                            </div>
                            <div className="flex">
                                <Image
                                    className="mx-auto h-12 w-fit dark:invert"
                                    src="/kerja-sama/tegalkab.png"
                                    alt="Tegal Kabupaten Logo"
                                    height="40"
                                    width="40"
                                />
                            </div>
                            <div className="flex">
                                <Image
                                    className="mx-auto h-12 w-fit dark:invert"
                                    src="/kerja-sama/logo_cempaka.jpg"
                                    alt="Cempaka Logo"
                                    height="40"
                                    width="40"
                                />
                            </div>
                        </InfiniteSlider>

                        <div className="bg-linear-to-r from-background absolute inset-y-0 left-0 w-20"></div>
                        <div className="bg-linear-to-l from-background absolute inset-y-0 right-0 w-20"></div>
                        <ProgressiveBlur
                            className="pointer-events-none absolute left-0 top-0 h-full w-20"
                            direction="left"
                            blurIntensity={1}
                        />
                        <ProgressiveBlur
                            className="pointer-events-none absolute right-0 top-0 h-full w-20"
                            direction="right"
                            blurIntensity={1}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
