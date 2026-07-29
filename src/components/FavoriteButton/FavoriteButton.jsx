import { Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { cx } from '../../utils/classNames'
import { useAuth } from '../../store/useAuth'
import { favoriteListing, unfavoriteListing } from '../../store/favoritesSlice'
import styles from './FavoriteButton.module.css'

export function FavoriteButton({ listingId, className = '' }) {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const isFavorite = useSelector(state => state.favorites.ids.includes(listingId))

  const toggle = event => {
    event.preventDefault()
    event.stopPropagation()
    if (!user) {
      navigate('/auth')
      return
    }
    if (isFavorite) dispatch(unfavoriteListing({ uid: user.uid, listingId }))
    else dispatch(favoriteListing({ uid: user.uid, listingId }))
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cx(styles.button, isFavorite && styles.active, className)}
      aria-label={t(isFavorite ? 'account.removeFavorite' : 'account.addFavorite')}
      aria-pressed={isFavorite}
    >
      <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
    </button>
  )
}
