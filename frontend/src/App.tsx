function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#0f172a',
      color: '#e2e8f0'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐ Star Note</h1>
      <p style={{ fontSize: '1.25rem', color: '#94a3b8' }}>
        네트워크 그래프 기반 지식관리 노트 앱
      </p>
      <p style={{ marginTop: '2rem', color: '#64748b' }}>
        개발 환경이 정상적으로 설정되었습니다.
      </p>
    </div>
  )
}

export default App
