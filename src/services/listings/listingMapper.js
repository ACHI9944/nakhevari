export const mapTimestamp = value => typeof value?.toMillis === 'function' ? value.toMillis() : value

export const mapListing = snapshot => {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    ...data,
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
    reviewedAt: mapTimestamp(data.reviewedAt),
  }
}
