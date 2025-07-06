"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type Language = "EN" | "RU" | "KZ"

interface Translations {
  // Login page
  login: string
  iinPlaceholder: string
  surnamePlaceholder: string
  firstnamePlaceholder: string
  acceptTerms: string
  proceed: string
  initialScreen: string

  // Welcome page
  welcomeTitle: string
  welcomeHeading: string
  welcomeText: string

  // Popup
  popupTitle: string
  popupContent: string

  // Quiz page
  progressBar: string
  questionSelection: string
  submit: string
  loadingQuestions: string
  
  // Multi-stage quiz
  grammarStage: string
  vocabularyStage: string
  readingStage: string
  remainingTime: string
  overallProgress: string
  stageProgress: string
  finishStage: string
  timeUp: string
  stageCompleted: string
  stageInProgress: string
  stageNotStarted: string
  testProgress: string
  stagesCompleted: string
  allStagesCompleted: string
  viewResults: string

  // Results page
  congratulationsTitle: string
  resultDescription: string
  level: string
  calculatingResults: string
  failedToLoad: string
  tryAgain: string
  score: string
  accuracy: string
  finalProceed: string

  // Already completed page
  testAlreadyCompleted: string
  alreadyCompletedMessage: string
  previousResults: string
  noPreviousResults: string
  loginAsAnotherUser: string
  date: string
  applicantIIN: string
}

const translations: Record<Language, Translations> = {
  EN: {
    // Login page
    login: "Login",
    iinPlaceholder: "Individual Identification Number (12 digits)",
    surnamePlaceholder: "surname",
    firstnamePlaceholder: "firstname",
    acceptTerms: "Accept Terms and Services",
    proceed: "Proceed",
    initialScreen: "Initial screen",

    // Welcome page
    welcomeTitle: "KELET (KBTU English Language Entry Test)",
    welcomeHeading: "Dear Applicants, Welcome to KBTU!",
    welcomeText:
      "Before starting your studies, each applicant must pass the KELET (KBTU English Language Entry Test), developed by the English Language Sector of the KBTU School of Social Sciences. Since all instruction at KBTU is conducted exclusively in English, determining the level of language proficiency is a mandatory step in forming language groups.\n\nKELET consists of four consecutive sections, each containing questions designed to assess your grammar, vocabulary, and reading comprehension. All tasks are in multiple-choice format. Completion of each part is limited in time and is available only once. Moving on to the next part is possible only after successful completion of the previous one. If the minimum number of points is not reached, the test is considered complete.\n\nThe test is mandatory for all applicants except for those who have an official valid (within two years) official TOEFL or IELTS certificate. Retaking the test is only allowed in the event of a technical failure (e.g., internet or power outage), and only upon submission of a screenshot or photo of the error to the Admissions Office.",

    // Popup
    popupTitle: "Instructions Before Starting the Test",
    popupContent:
      "Before starting the test, make sure that your device is functioning properly, connected to a stable internet connection, and fully charged. We recommend having a bottle of water with you to help stay focused. Completing all four parts may take up to 80 minutes. All sections must be completed strictly in sequence, from Part 1 to Part 4. Compliance with the sequence is strictly mandatory.\n\nWe strongly recommend that applicants complete KELET independently, without any external assistance or online tools. The accuracy of your results is crucial: only in this case you will be enrolled in a language group that matches your actual knowledge, which directly affects the effectiveness of subsequent training.",

    // Quiz page
    progressBar: "Progress bar",
    questionSelection: "Question Selection",
    submit: "Submit",
    loadingQuestions: "Loading questions...",

    // Multi-stage quiz
    grammarStage: "Grammar Stage",
    vocabularyStage: "Vocabulary Stage", 
    readingStage: "Reading Stage",
    remainingTime: "Remaining Time",
    overallProgress: "Overall Progress",
    stageProgress: "Stage Progress",
    finishStage: "Finish Stage",
    timeUp: "Time's up!",
    stageCompleted: "Completed",
    stageInProgress: "In Progress",
    stageNotStarted: "Not Started",
    testProgress: "Test Progress",
    stagesCompleted: "stages completed",
    allStagesCompleted: "All stages completed! You can view your results.",
    viewResults: "View Results",

    // Results page
    congratulationsTitle: "Congratulations",
    resultDescription: "Result Description",
    level: "Level",
    calculatingResults: "Calculating your results...",
    failedToLoad: "Failed to load results",
    tryAgain: "Try Again",
    score: "Score",
    accuracy: "Accuracy",
    finalProceed: "Proceed",

    // Already completed page
    testAlreadyCompleted: "Test Already Completed",
    alreadyCompletedMessage: "You have already completed the test. Would you like to login as another user?",
    previousResults: "Previous Results",
    noPreviousResults: "No previous results found",
    loginAsAnotherUser: "Login as Another User",
    date: "Date",
    applicantIIN: "Applicant IIN",
  },

  RU: {
    // Login page
    login: "Вход",
    iinPlaceholder: "Индивидуальный идентификационный номер (12 цифр)",
    surnamePlaceholder: "фамилия",
    firstnamePlaceholder: "имя",
    acceptTerms: "Принять условия и соглашения",
    proceed: "Продолжить",
    initialScreen: "Начальный экран",

    // Welcome page
    welcomeTitle: "KELET (KBTU English Language Entry Test)",
    welcomeHeading: "Уважаемые абитуриенты! Добро пожаловать в KBTU!",
    welcomeText:
      "Перед началом обучения каждый поступающий обязан пройти тест KELET (KBTU English Language Entry Test), разработанный сектором английского языка Школы социальных наук КБТУ. Поскольку обучение в КБТУ ведется исключительно на английском языке, определение уровня владения языком является обязательным шагом для формирования языковых групп.\n\nKELET состоит из четырех последовательных блоков, в каждой из которых содержатся вопросы, проверяющие понимание грамматики, знание лексики и навыки чтения. Все задания имеют формат выбора одного правильного варианта из предложенных. Выполнение каждой части ограничено по времени и доступно только один раз. Переход к следующей части возможен только после успешного завершения предыдущей. При недоборе минимального количества баллов тестирование считается завершённым.\n\nТест обязателен для всех абитуриентов, кроме имеющих официальный действующий по срокам сертификат TOEFL или IELTS (а именно - 2 года). Повторная сдача возможна только в случае технического сбоя (отключение интернета, электричества), при предоставлении скриншота/фото экрана в момент ошибки в Приемную комиссию.",

    // Popup
    popupTitle: "Инструкции перед началом теста",
    popupContent:
      "Перед началом теста важно убедиться, что используемое устройство работает исправно, подключено к стабильному интернету и полностью заряжено. Рекомендуется взять с собой воду – это поможет вам оставаться сосредоточенным. На прохождение всех 4 блоков уходит до 80 минут. Все части теста проходят в строго установленной последовательности от Part 1 до Part 4. Соблюдение последовательности строго обязательно.\n\nМы настоятельно рекомендуем абитуриентам выполнять KELET самостоятельно, без использования сторонней помощи или онлайн-ресурсов. Точность результатов имеет ключевое значение: только в этом случае Вы будете зачислены в языковую группу, соответствующую вашим реальным знаниям, что напрямую влияет на эффективность последующего обучения.",

    // Quiz page
    progressBar: "Индикатор прогресса",
    questionSelection: "Выбор вопроса",
    submit: "Отправить",
    loadingQuestions: "Загрузка вопросов...",

    // Multi-stage quiz
    grammarStage: "Этап грамматики",
    vocabularyStage: "Этап лексики",
    readingStage: "Этап чтения",
    remainingTime: "Оставшееся время",
    overallProgress: "Общий прогресс",
    stageProgress: "Прогресс этапа",
    finishStage: "Завершить этап",
    timeUp: "Время истекло!",
    stageCompleted: "Завершено",
    stageInProgress: "В процессе",
    stageNotStarted: "Не начат",
    testProgress: "Прогресс теста",
    stagesCompleted: "этапов завершено",
    allStagesCompleted: "Все этапы завершены! Вы можете просмотреть результаты.",
    viewResults: "Посмотреть результаты",

    // Results page
    congratulationsTitle: "Поздравление",
    resultDescription: "Описание результата",
    level: "Уровень",
    calculatingResults: "Подсчет ваших результатов...",
    failedToLoad: "Не удалось загрузить результаты",
    tryAgain: "Попробовать снова",
    score: "Результат",
    accuracy: "Точность",
    finalProceed: "Продолжить",

    // Already completed page
    testAlreadyCompleted: "Тест уже завершен",
    alreadyCompletedMessage: "Вы уже прошли тест. Хотите войти как другой пользователь?",
    previousResults: "Предыдущие результаты",
    noPreviousResults: "Предыдущих результатов не найдено",
    loginAsAnotherUser: "Войти как другой пользователь",
    date: "Дата",
    applicantIIN: "Номер заявки",
  },

  KZ: {
    // Login page
    login: "Кіру",
    iinPlaceholder: "Жеке сәйкестендіру нөмірі (12 сан)",
    surnamePlaceholder: "тегі",
    firstnamePlaceholder: "аты",
    acceptTerms: "Шарттар мен келісімдерді қабылдау",
    proceed: "Жалғастыру",
    initialScreen: "Бастапқы экран",

    // Welcome page
    welcomeTitle: "KELET (KBTU English Language Entry Test)",
    welcomeHeading: "Құрметті талапкер! ҚБТУ-ға қош келдіңіз!",
    welcomeText:
      "Оқуды бастамас бұрын әрбір талапкер ҚБТУ Әлеуметтік ғылымдар мектебінің ағылшын тілі секторы әзірлеген KELET (KBTU English Language Entry Test) тестінен өтуі керек. ҚБТУ-да оқыту тек ағылшын тілінде жүргізілетіндіктен, тілді меңгеру деңгейін анықтау тіл топтарын құрудағы міндетті қадам болып табылады.\n\nKELET төрт блоктан тұрады, олардың әрқайсысында грамматиканы түсінуді, сөздік қорын білуді және оқу дағдыларын тексеретін сұрақтар бар. Барлық тапсырмалар ұсынылған нұсқалардан бір дұрыс нұсқаны таңдау форматында әзірленген. Әрбір бөлікті орындау уақытпен шектелген және тек бір рет орындауға мүскіндік берілген. Келесі бөлікке өту алдыңғы бөлікті сәтті аяқтағаннан кейін ғана мүмкін болады. Ең төменгі ұпай санына жетпесе, тестілеу аяқталды деп есептеледі.\n\nТестілеу ресми жарамды TOEFL немесе IELTS сертификаты (дәлірек айтқанда - 2 жыл) бар адамдарды қоспағанда, барлық үміткерлер үшін міндетті болып табылады. Қайта тапсыру тек техникалық ақаулық (интернет үзілістері, электр қуатының үзілуі) жағдайында, қате болған кездегі экранның скриншотын/фотосын қабылдау комиссиясына ұсынған жағдайда ғана мүмкін болады.",

    // Popup
    popupTitle: "Тест алдында нұсқаулар",
    popupContent:
      "Тест алдында сіз пайдаланып жатқан құрылғы дұрыс жұмыс істеп тұрғанын, тұрақты интернетке қосылғанын және толық зарядталғанын тексеру маңызды. Өзіңізбен бірге су алу ұсынылады. Барлық 4 бөлімді аяқтау үшін 80 минутқа дейін уақыт кетеді. Тесттің барлық бөліктері 1-бөлімнен 4-бөлімге дейін қатаң белгіленген реттілікпен өткізіледі. Кезектілікті сақтау қатаң түрде міндетті болып табылады.\n\nҮміткерлерге KELET-ті үшінші тарап көмегін немесе онлайн ресурстарды пайдаланбай өз бетінше өтуді ұсынамыз. Нәтижелердің дәлдігі маңызды: тек осы жағдайда ғана сіз нақты біліміңізге сәйкес келетін тілдік топқа жазыласыз, бұл кейінгі оқытудың тиімділігіне тікелей әсер етеді.",

    // Quiz page
    progressBar: "Прогресс жолағы",
    questionSelection: "Сұрақ таңдау",
    submit: "Жіберу",
    loadingQuestions: "Сұрақтар жүктелуде...",

    // Multi-stage quiz
    grammarStage: "Грамматика кезеңі",
    vocabularyStage: "Сөздік кезеңі",
    readingStage: "Оқу кезеңі",
    remainingTime: "Қалған уақыт",
    overallProgress: "Жалпы прогресс",
    stageProgress: "Кезең прогрессі",
    finishStage: "Кезеңді аяқтау",
    timeUp: "Уақыт бітті!",
    stageCompleted: "Аяқталды",
    stageInProgress: "Жүріп жатыр",
    stageNotStarted: "Басталмаған",
    testProgress: "Тест прогрессі",
    stagesCompleted: "кезеңдер аяқталды",
    allStagesCompleted: "Барлық кезеңдер аяқталды! Нәтижелеріңізді көре аласыз.",
    viewResults: "Нәтижелерді көру",

    // Results page
    congratulationsTitle: "Құттықтаймыз",
    resultDescription: "Нәтиже сипаттамасы",
    level: "Деңгей",
    calculatingResults: "Нәтижелеріңіз есептелуде...",
    failedToLoad: "Нәтижелерді жүктеу мүмкін болмады",
    tryAgain: "Қайта көру",
    score: "Нәтиже",
    accuracy: "Дәлдік",
    finalProceed: "Жалғастыру",

    // Already completed page
    testAlreadyCompleted: "Тест бұрын аяқталған",
    alreadyCompletedMessage: "Сіз бұл тестті бұрын аяқтадыңыз. Міне, сіздің алдыңғы нәтижелеріңіз:",
    previousResults: "Алдыңғы нәтижелер",
    noPreviousResults: "Алдыңғы нәтижелер табылмады",
    loginAsAnotherUser: "Басқа пайдаланушы ретінде кіру",
    date: "Күні",
    applicantIIN: "Өтініш берушінің ЖСН",
  },
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("EN")

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem("kbtu-language") as Language
    if (savedLanguage && ["EN", "RU", "KZ"].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("kbtu-language", lang)
  }

  const value = {
    language,
    setLanguage: handleSetLanguage,
    t: translations[language],
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
