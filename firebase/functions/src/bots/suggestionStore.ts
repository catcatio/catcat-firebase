const suggestionStoreFactory = (suggestionsRepository) => {
  const addSuggestion = async (from, suggestion) => {
    const recordDate = Date.now()
    console.log({
      from,
      suggestion,
      recordDate
    })
    return await suggestionsRepository.put(`${recordDate}`, {
      from,
      suggestion,
      recordDate
    })
  }

  return {
    addSuggestion
  }
}

export default suggestionStoreFactory