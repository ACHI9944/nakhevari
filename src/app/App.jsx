import { Component } from 'react'
import { AuthInitializer } from '../store/AuthInitializer'
import { AppRoutes } from '../navigation/AppRoutes'
import { ScrollManager } from './ScrollManager'
import i18n from '../translations'
import styles from './App.module.css'

class AppErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return <main className={styles.errorMain}>
      <div className={styles.errorCard}>
        <h1 className={styles.errorTitle}>{i18n.t('app.errorTitle')}</h1>
        <p className={styles.errorText}>{i18n.t('app.errorText')}</p>
        <button type="button" onClick={() => window.location.reload()} className={styles.reloadButton}>{i18n.t('app.reload')}</button>
      </div>
    </main>
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthInitializer>
        <ScrollManager />
        <AppRoutes />
      </AuthInitializer>
    </AppErrorBoundary>
  )
}
