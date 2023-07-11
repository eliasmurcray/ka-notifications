(()=>{"use strict";const n=JSON.parse('{"AddFeedbackToDiscussion":"mutation AddFeedbackToDiscussion($focusKind: String, $focusId: String, $parentKey: String, $textContent: String!, $feedbackType: FeedbackType!, $fromVideoAuthor: Boolean, $shownLowQualityNotice: Boolean) {\\n  addFeedbackToDiscussion(focusKind: $focusKind, focusId: $focusId, parentKey: $parentKey, textContent: $textContent, feedbackType: $feedbackType, fromVideoAuthor: $fromVideoAuthor, shownLowQualityNotice: $shownLowQualityNotice) {\\n    feedback {\\n      appearsAsDeleted\\n      author {\\n        id\\n        kaid\\n        nickname\\n        avatar {\\n          name\\n          imageSrc\\n          __typename\\n        }\\n        __typename\\n      }\\n      content\\n      date\\n      definitelyNotSpam\\n      deleted\\n      downVoted\\n      expandKey\\n      feedbackType\\n      flaggedBy\\n      flags\\n      focusUrl\\n      focus {\\n        kind\\n        id\\n        translatedTitle\\n        relativeUrl\\n        __typename\\n      }\\n      fromVideoAuthor\\n      key\\n      lowQualityScore\\n      notifyOnAnswer\\n      permalink\\n      qualityKind\\n      replyCount\\n      replyExpandKeys\\n      showLowQualityNotice\\n      sumVotesIncremented\\n      upVoted\\n      ... on LowQualityFeedback {\\n        feedbackCode\\n        feedbackChar\\n        __typename\\n      }\\n      __typename\\n    }\\n    error {\\n      code\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n","clearBrandNewNotifications":"mutation clearBrandNewNotifications {\\n  clearBrandNewNotifications {\\n    error {\\n      code\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n","feedbackQuery":"query feedbackQuery($topicId: String!, $focusKind: String!, $cursor: String, $limit: Int, $feedbackType: FeedbackType!, $currentSort: Int, $qaExpandKey: String) {\\n  feedback(focusId: $topicId, cursor: $cursor, limit: $limit, feedbackType: $feedbackType, focusKind: $focusKind, sort: $currentSort, qaExpandKey: $qaExpandKey, answersLimit: 1) {\\n    feedback {\\n      isLocked\\n      isPinned\\n      replyCount\\n      appearsAsDeleted\\n      author {\\n        id\\n        kaid\\n        nickname\\n        avatar {\\n          name\\n          imageSrc\\n          __typename\\n        }\\n        __typename\\n      }\\n      badges {\\n        name\\n        icons {\\n          smallUrl\\n          __typename\\n        }\\n        description\\n        __typename\\n      }\\n      content\\n      date\\n      definitelyNotSpam\\n      deleted\\n      downVoted\\n      expandKey\\n      feedbackType\\n      flaggedBy\\n      flaggedByUser\\n      flags\\n      focusUrl\\n      focus {\\n        kind\\n        id\\n        translatedTitle\\n        relativeUrl\\n        __typename\\n      }\\n      fromVideoAuthor\\n      key\\n      lowQualityScore\\n      notifyOnAnswer\\n      permalink\\n      qualityKind\\n      replyCount\\n      replyExpandKeys\\n      showLowQualityNotice\\n      sumVotesIncremented\\n      upVoted\\n      ... on QuestionFeedback {\\n        hasAnswered\\n        answers {\\n          isLocked\\n          isPinned\\n          replyCount\\n          appearsAsDeleted\\n          author {\\n            id\\n            kaid\\n            nickname\\n            avatar {\\n              name\\n              imageSrc\\n              __typename\\n            }\\n            __typename\\n          }\\n          badges {\\n            name\\n            icons {\\n              smallUrl\\n              __typename\\n            }\\n            description\\n            __typename\\n          }\\n          content\\n          date\\n          definitelyNotSpam\\n          deleted\\n          downVoted\\n          expandKey\\n          feedbackType\\n          flaggedBy\\n          flaggedByUser\\n          flags\\n          focusUrl\\n          focus {\\n            kind\\n            id\\n            translatedTitle\\n            relativeUrl\\n            __typename\\n          }\\n          fromVideoAuthor\\n          key\\n          lowQualityScore\\n          notifyOnAnswer\\n          permalink\\n          qualityKind\\n          replyCount\\n          replyExpandKeys\\n          showLowQualityNotice\\n          sumVotesIncremented\\n          upVoted\\n          __typename\\n        }\\n        isOld\\n        answerCount\\n        __typename\\n      }\\n      ... on AnswerFeedback {\\n        question {\\n          isLocked\\n          isPinned\\n          replyCount\\n          appearsAsDeleted\\n          author {\\n            id\\n            kaid\\n            nickname\\n            avatar {\\n              name\\n              imageSrc\\n              __typename\\n            }\\n            __typename\\n          }\\n          badges {\\n            name\\n            icons {\\n              smallUrl\\n              __typename\\n            }\\n            description\\n            __typename\\n          }\\n          content\\n          date\\n          definitelyNotSpam\\n          deleted\\n          downVoted\\n          expandKey\\n          feedbackType\\n          flaggedBy\\n          flaggedByUser\\n          flags\\n          focusUrl\\n          focus {\\n            kind\\n            id\\n            translatedTitle\\n            relativeUrl\\n            __typename\\n          }\\n          fromVideoAuthor\\n          key\\n          lowQualityScore\\n          notifyOnAnswer\\n          permalink\\n          qualityKind\\n          replyCount\\n          replyExpandKeys\\n          showLowQualityNotice\\n          sumVotesIncremented\\n          upVoted\\n          __typename\\n        }\\n        __typename\\n      }\\n      __typename\\n    }\\n    cursor\\n    isComplete\\n    sortedByDate\\n    __typename\\n  }\\n}\\n","getFeedbackRepliesPage":"query getFeedbackRepliesPage($postKey: String!, $cursor: String, $limit: Int!) {\\n  feedbackRepliesPaginated(feedbackKey: $postKey, cursor: $cursor, limit: $limit) {\\n    cursor\\n    isComplete\\n    feedback {\\n      isLocked\\n      expandKey\\n      appearsAsDeleted\\n      author {\\n        id\\n        kaid\\n        nickname\\n        avatar {\\n          name\\n          imageSrc\\n          __typename\\n        }\\n        __typename\\n      }\\n      content\\n      date\\n      definitelyNotSpam\\n      deleted\\n      downVoted\\n      expandKey\\n      feedbackType\\n      flaggedBy\\n      flaggedByUser\\n      flags\\n      focusUrl\\n      fromVideoAuthor\\n      key\\n      lowQualityScore\\n      notifyOnAnswer\\n      permalink\\n      qualityKind\\n      replyCount\\n      replyExpandKeys\\n      showLowQualityNotice\\n      sumVotesIncremented\\n      upVoted\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n","getFullUserProfile":"query getFullUserProfile($kaid: String, $username: String) {\\n  user(kaid: $kaid, username: $username) {\\n    id\\n    kaid\\n    key\\n    userId\\n    email\\n    username\\n    profileRoot\\n    gaUserId\\n    isPhantom\\n    isDeveloper: hasPermission(name: \\"can_do_what_only_admins_can_do\\")\\n    isCurator: hasPermission(name: \\"can_curate_tags\\", scope: ANY_ON_CURRENT_LOCALE)\\n    isCreator: hasPermission(name: \\"has_creator_role\\", scope: ANY_ON_CURRENT_LOCALE)\\n    isPublisher: hasPermission(name: \\"can_publish\\", scope: ANY_ON_CURRENT_LOCALE)\\n    isModerator: hasPermission(name: \\"can_moderate_users\\", scope: GLOBAL)\\n    isParent\\n    isTeacher\\n    isDataCollectible\\n    isChild\\n    isOrphan\\n    isCoachingLoggedInUser\\n    canModifyCoaches\\n    nickname\\n    hideVisual\\n    joined\\n    points\\n    countVideosCompleted\\n    bio\\n    profile {\\n      accessLevel\\n      __typename\\n    }\\n    soundOn\\n    muteVideos\\n    showCaptions\\n    prefersReducedMotion\\n    noColorInVideos\\n    newNotificationCount\\n    canHellban: hasPermission(name: \\"can_ban_users\\", scope: GLOBAL)\\n    canMessageUsers: hasPermission(name: \\"can_send_moderator_messages\\", scope: GLOBAL)\\n    isSelf: isActor\\n    hasStudents: hasCoachees\\n    hasClasses\\n    hasChildren\\n    hasCoach\\n    badgeCounts\\n    homepageUrl\\n    isMidsignupPhantom\\n    includesDistrictOwnedData\\n    canAccessDistrictsHomepage\\n    preferredKaLocale {\\n      id\\n      kaLocale\\n      status\\n      __typename\\n    }\\n    underAgeGate {\\n      parentEmail\\n      daysUntilCutoff\\n      approvalGivenAt\\n      __typename\\n    }\\n    authEmails\\n    signupDataIfUnverified {\\n      email\\n      emailBounced\\n      __typename\\n    }\\n    pendingEmailVerifications {\\n      email\\n      __typename\\n    }\\n    tosAccepted\\n    shouldShowAgeCheck\\n    birthMonthYear\\n    lastLoginCountry\\n    __typename\\n  }\\n  actorIsImpersonatingUser\\n  isAIGuideEnabled\\n  hasAccessToAIGuideDev\\n}\\n","getNotificationsForUser":"query getNotificationsForUser($after: ID) {\\n  user {\\n    id\\n    notifications(after: $after) {\\n      notifications {\\n        __typename\\n        brandNew\\n        class_\\n        date\\n        kaid\\n        read\\n        url\\n        urlsafeKey\\n        ...ThreadCreatedNotificationType\\n        ...AssignmentDueDateNotificationType\\n        ...AssignmentCreatedNotificationType\\n        ...CoachRequestNotificationType\\n        ...BadgeNotificationType\\n        ...CourseMasteryGoalCreatedNotificationType\\n        ...ModeratorNotificationType\\n        ...ProgramFeedbackNotificationType\\n        ...CoachRequestAcceptedNotificationType\\n        ...AvatarNotificationType\\n        ...InfoNotificationType\\n        ...ResponseFeedbackNotificationType\\n        ...GroupedBadgeNotificationType\\n      }\\n      pageInfo {\\n        nextCursor\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\\nfragment AssignmentCreatedNotificationType on AssignmentCreatedNotification {\\n  numAssignments\\n  contentTitle\\n  curationNodeIconURL\\n  className\\n  __typename\\n}\\n\\nfragment AssignmentDueDateNotificationType on AssignmentDueDateNotification {\\n  numAssignments\\n  dueDate\\n  contentTitle\\n  curationNodeIconURL\\n  __typename\\n}\\n\\nfragment AvatarNotificationType on AvatarNotification {\\n  name\\n  thumbnailSrc\\n  __typename\\n}\\n\\nfragment BadgeNotificationType on BadgeNotification {\\n  badgeName\\n  badge {\\n    description\\n    fullDescription\\n    name\\n    relativeUrl\\n    icons {\\n      compactUrl\\n      __typename\\n    }\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment CoachRequestAcceptedNotificationType on CoachRequestAcceptedNotification {\\n  isMultipleClassrooms\\n  student {\\n    id\\n    email\\n    nickname\\n    __typename\\n  }\\n  classroom {\\n    cacheId\\n    id\\n    name\\n    topics {\\n      id\\n      slug\\n      iconUrl\\n      key\\n      translatedStandaloneTitle\\n      __typename\\n    }\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment CoachRequestNotificationType on CoachRequestNotification {\\n  coachIsParent\\n  coach {\\n    id\\n    kaid\\n    nickname\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment CourseMasteryGoalCreatedNotificationType on CourseMasteryGoalCreatedNotification {\\n  curationNodeIconURL\\n  curationNodeTranslatedTitle\\n  masteryPercentage\\n  __typename\\n}\\n\\nfragment GroupedBadgeNotificationType on GroupedBadgeNotification {\\n  badgeNotifications {\\n    badge {\\n      badgeCategory\\n      description\\n      fullDescription\\n      name\\n      icons {\\n        compactUrl\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n  __typename\\n}\\n\\nfragment InfoNotificationType on InfoNotification {\\n  notificationType\\n  __typename\\n}\\n\\nfragment ModeratorNotificationType on ModeratorNotification {\\n  text\\n  __typename\\n}\\n\\nfragment ProgramFeedbackNotificationType on ProgramFeedbackNotification {\\n  authorAvatarSrc\\n  authorNickname\\n  feedbackType\\n  translatedScratchpadTitle\\n  content\\n  __typename\\n}\\n\\nfragment ResponseFeedbackNotificationType on ResponseFeedbackNotification {\\n  authorAvatarUrl\\n  authorNickname\\n  feedbackType\\n  focusTranslatedTitle\\n  content\\n  sumVotesIncremented\\n  __typename\\n}\\n\\nfragment ThreadCreatedNotificationType on ThreadCreatedNotification {\\n  coachee {\\n    id\\n    kaid\\n    nickname\\n    __typename\\n  }\\n  threadId\\n  flagged\\n  __typename\\n}\\n"}');const e="khanAcademyNotifications";async function a(){const e=performance.now(),a=await async function(){let e,a;try{e=await new Promise(((n,e)=>{chrome.cookies.get({url:"https://www.khanacademy.org",name:"KAAS"},(a=>{if(null===a)return e("No KAAS cookie found.");n(a.value)}))}))}catch(n){return{error:"cookie"}}try{a=await function(e,a,t={}){return new Promise(((o,i)=>{fetch("https://www.khanacademy.org/api/internal/graphql/"+e+"?/_fastly/",{method:"POST",headers:{"X-KA-fkey":"a","Content-Type":"application/json",Cookie:`fkey=a;kaas=${a}`},body:JSON.stringify({operationName:e,query:n[e],variables:t}),credentials:"same-origin"}).then((async n=>{if(200===n.status)return o(n);i(`Error in GraphQL "${e}" call: Server responded  with status ${n.status}.`)})).catch(i)}))}("getNotificationsForUser",e)}catch(n){return"Failed to fetch"===n.message?{error:"network"}:{error:"response",value:n.message}}const t=await a.json();let o=t?.data?.user?.notifications;return o?{value:{notifications:o.notifications,cursor:o.pageInfo.nextCursor}}:{error:"no notifications"}}();if(void 0===a.error)return console.log(`Notifications (${(performance.now()-e).toFixed(3)}ms): `,a.value.notifications),void chrome.storage.local.set({prefetch_data:a.value.notifications,prefetch_cursor:a.value.cursor});switch(a.error){case"cookie":console.log("User is not logged in."),chrome.action.setBadgeText({text:""}),chrome.storage.local.set({cached_data:"<div>You are logged out!</div>",cached_cursor:""});break;case"response":console.error("Error in response: ",a.value);break;case"network":console.log("Possible network disconnect detected, please check your internet connection.");break;case"no notifications":console.log("User has no notifications."),chrome.action.setBadgeText({text:""}),chrome.storage.local.remove(["prefetch_data","prefetch_cursor"])}}chrome.runtime.onInstalled.addListener((async function(){await(chrome.offscreen.hasDocument?.())||await chrome.offscreen.createDocument({url:chrome.runtime.getURL("heartbeat.html"),reasons:[chrome.offscreen.Reason.BLOBS],justification:"Keep service worker alive."})})),chrome.runtime.onMessage.addListener((n=>{n.keepAlive})),chrome.cookies.onChanged.addListener((async({cookie:{name:n},removed:e})=>{"KAAS"===n&&(chrome.action.setBadgeText({text:""}),chrome.storage.local.remove(["prefetch_data","prefetch_cursor"]),!1===e&&(console.log("Logged in!"),a()))})),chrome.alarms.onAlarm.addListener((async({name:n})=>{n===e&&a()})),chrome.action.setBadgeBackgroundColor({color:"#00BFA5"}),chrome.alarms.clear(e),chrome.alarms.create(e,{periodInMinutes:1}),a()})();