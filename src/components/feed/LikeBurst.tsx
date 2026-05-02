import { HeartIcon } from './icons'
import './LikeBurst.css'

interface Props {
  trigger: number
}

function LikeBurst({ trigger }: Props) {
  if (trigger === 0) return null
  return (
    <div key={trigger} className="like-burst" aria-hidden="true">
      <HeartIcon size={120} filled />
    </div>
  )
}

export default LikeBurst
