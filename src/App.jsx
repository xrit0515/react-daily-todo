import { useState, useEffect } from 'react'

// ———— 【仅修改这里：你的Gist ID】————
const GIST_ID = "792b94cbe587cef4afa4dadee16d6017";
// ———— 【自定义预设任务】————
const DAILY_DEFAULT_TODOS = [
  "Brilliant学习",
  "Duolingo学习",
  "早睡",
  "查看今日待办,近期计划",
  "俯卧撑",
  "吃保健品",
  "晚上刷牙",
  "早睡不熬夜"
];

function App() {
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0])
  const [todoList, setTodoList] = useState([])
  const [inputText, setInputText] = useState('')
  const [token, setToken] = useState('')
  const [tokenInput, setTokenInput] = useState('')
  const [loading, setLoading] = useState(false)

  // 从本地存储加载token（安全，不上传云端）
  useEffect(() => {
    const savedToken = localStorage.getItem('GITHUB_TOKEN')
    if (savedToken) setToken(savedToken)
  }, [])

  // 保存token到本地
  const saveToken = () => {
    if (!tokenInput.trim()) return
    localStorage.setItem('GITHUB_TOKEN', tokenInput)
    setToken(tokenInput)
    setTokenInput('')
  }

  // 格式化日期
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    })
  }

  // 云端加载数据
  const loadData = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: { Authorization: `token ${token}` }
      })
      const data = await res.json()
      const allTodos = JSON.parse(data.files['todo-data.json'].content || '{}')
      setTodoList(allTodos[currentDate] || [])
    } catch (err) {
      console.error('加载失败', err)
    }
    setLoading(false)
  }

  // 云端保存数据
  const saveData = async (newTodos) => {
    if (!token) return
    try {
      const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: {
            'todo-data.json': {
              content: JSON.stringify({
                ...JSON.parse((await (await fetch(`https://api.github.com/gists/${GIST_ID}`, {
                  headers: { Authorization: `token ${token}` }
                })).json()).files['todo-data.json'].content || '{}'),
                [currentDate]: newTodos
              }, null, 2)
            }
          }
        })
      })
      if (res.ok) loadData()
    } catch (err) {
      console.error('保存失败', err)
    }
  }

  // 切换日期
  const changeDate = (dir) => {
    const prev = new Date(currentDate)
    dir === 'prev' ? prev.setDate(prev.getDate() - 1) : prev.setDate(prev.getDate() + 1)
    setCurrentDate(prev.toISOString().split('T')[0])
  }

  // 一键加载预设任务
  const loadDefaultTodos = () => {
    const defaultTasks = DAILY_DEFAULT_TODOS.map(item => ({ text: item, completed: false }))
    saveData(defaultTasks)
  }

  // 手动添加任务
  const addTodo = () => {
    if (!inputText.trim()) return
    const newTodos = [...todoList, { text: inputText, completed: false }]
    saveData(newTodos)
    setInputText('')
  }

  // 切换完成状态
  const toggleTodo = (index) => {
    const newTodos = [...todoList]
    newTodos[index].completed = !newTodos[index].completed
    saveData(newTodos)
  }

  useEffect(() => {
    if (token) loadData()
  }, [currentDate, token])

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">📅 每日待办清单</h1>
          <p className="text-gray-500">云端同步 · 多设备通用 · 安全无密钥泄露</p>
        </div>

        {/* 🔑 密钥输入框（仅首次输入） */}
        {!token && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <div className="flex gap-2">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="输入你的GitHub PAT，仅本地存储..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button onClick={saveToken} className="bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition font-medium">
                保存
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">密钥仅保存在你的浏览器，绝不上传代码仓库</p>
          </div>
        )}

        {token && (
          <>
            {/* 日期切换 */}
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex justify-between items-center">
              <button onClick={() => changeDate('prev')} className="px-3 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition">← 前一天</button>
              <span className="font-medium text-gray-700">{formatDate(currentDate)}</span>
              <button onClick={() => changeDate('next')} className="px-3 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition">后一天 →</button>
            </div>

            {/* 操作栏 */}
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 space-y-4">
              <button onClick={loadDefaultTodos} className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium">🎯 一键加载预设任务</button>
              <div className="flex gap-2">
                <input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="添加临时任务..." onKeyPress={(e) => e.key === 'Enter' && addTodo()} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <button onClick={addTodo} className="bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition font-medium">添加</button>
              </div>
            </div>

            {/* 任务列表 */}
            <div className="bg-white rounded-2xl shadow-sm p-6 min-h-[300px]">
              {loading ? (
                <div className="text-center text-gray-400 py-10">🔄 同步中...</div>
              ) : todoList.length === 0 ? (
                <div className="text-center text-gray-400 py-10">点击加载预设任务 🎯</div>
              ) : (
                <div className="space-y-4">
                  {todoList.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition">
                      <input type="checkbox" checked={item.completed} onChange={() => toggleTodo(index)} className="w-5 h-5 text-indigo-600 rounded cursor-pointer" />
                      <span className={`text-lg ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App