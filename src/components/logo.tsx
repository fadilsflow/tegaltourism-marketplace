
import Image from 'next/image';

export const Logo = ({ className }: { className?: string; }) => {
    return (
        <div className="flex items-center gap-4">
            <Image src={"/logo.png"} width={40} height={40} alt='Jejak Rempah Logo' className={className} /> <span className='font-mono  font-bold '>Jejak Rempah</span>
        </div>
    )
}

export const LogoIcon = ({ className }: { className?: string; }) => {
    return (
        <Image src={"/logo.png"} width={40} height={40} alt='Jejak Rempah Logo' className={className} />
    )
}

