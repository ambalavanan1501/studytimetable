import { useRegisterSW } from 'virtual:pwa-register/react'
import { X } from 'lucide-react'

export function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r)
        },
        onRegisterError(error) {
            console.log('SW registration error', error)
        },
    })

    const close = () => {
        setOfflineReady(false)
        setNeedRefresh(false)
    }

    if (!offlineReady && !needRefresh) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 p-4 bg-slate-800 text-white rounded-lg shadow-lg flex items-center gap-4 max-w-sm animate-in slide-in-from-bottom-5">
            <div className="flex-1 text-sm">
                {offlineReady ? (
                    <span>App ready to work offline</span>
                ) : (
                    <span>New content available, click on reload button to update.</span>
                )}
            </div>
            {needRefresh && (
                <button
                    className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 rounded-md text-xs font-bold transition-colors"
                    onClick={() => updateServiceWorker(true)}
                >
                    Reload
                </button>
            )}
            <button
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                onClick={close}
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}
