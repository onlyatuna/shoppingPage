import { useRef } from 'react'

const messages = [
    '🎉 限時優惠：全館滿千免運！',
    '🛍️ T-shirt 只要 $500！',
    '🔥 Mug 買一送一！',
    '🚚 快速出貨，安心選購！',
    '📦 加入會員即贈 $100 購物金！',
]

type Props = {
    duration?: number // 秒，整個 track 滾過一次的時間
    className?: string
}

export default function VerticalMarqueeUp({ duration = 8, className = '' }: Props) {
    const list = [...messages]
    const trackRef = useRef<HTMLDivElement | null>(null)

    return (
        <div
            className={`marquee-wrapper overflow-hidden h-10 ${className}`}
            aria-label="最新消息跑馬燈"
        >
            <div className="flex items-center gap-2 px-2">
                <div
                    ref={trackRef}
                    className="marquee-track flex-1"
                    style={{ animationDuration: `${duration}s` }}
                    aria-hidden={false}
                    tabIndex={-1}
                >
                    {list.map((msg, i) => (
                        <div className="marquee-item whitespace-nowrap px-4" key={i}>
                            {msg}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
