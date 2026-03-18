import useApp from './models/useApp'
import useAuth from './models/useAuth'
import { CoursesProvider } from './models/useCourses.jsx'
import AuthView from './views/AuthView'
import DashboardView from './views/DashboardView'
import CareerPathsController from './controllers/CareerPathsController'
import CareerRoadmapController from './controllers/CareerRoadmapController'
import BrowseCoursesController from './controllers/BrowseCoursesController'
import QandAController from './controllers/QandAController'

function AppContent({ logout }) {
    const {
        message,
        currentView,
        selectedCareer,
        handleClick,
        goToDashboard,
        goToCareerPaths,
        openRoadmap
    } = useApp()

    if (currentView === 'careerPaths') {
        return (
            <CareerPathsController
                onBack={goToDashboard}
                onOpenRoadmap={openRoadmap}
            />
        )
    }

    if (currentView === 'roadmap') {
        return (
            <CareerRoadmapController
                career={selectedCareer}
                onBack={goToCareerPaths}
            />
        )
    }

    if (currentView === 'browseCourses') {
        return (
            <BrowseCoursesController onBack={goToDashboard} />
        )
    }

    if (currentView === 'qanda') {
        return <QandAController onBack={goToDashboard} />
    }

    return (
        <DashboardView
            message={message}
            onSectionClick={handleClick}
            onDashboardClick={goToDashboard}
            onLogout={logout}
        />
    )
}

function App() {
    const { session, loading, authError, login, signup, logout } = useAuth()

    if (loading) return null

    if (!session) {
        return <AuthView onLogin={login} onSignup={signup} error={authError} />
    }

    return (
        <CoursesProvider>
            <AppContent logout={logout} />
        </CoursesProvider>
    )
}

export default App
