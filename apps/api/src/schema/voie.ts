export const voieTypeDefs = /* GraphQL */ `
  "Voie (rue, avenue, etc.)"
  type Voie {
    "Identifiant unique"
    id: String!

    "Nom de la voie"
    nom: String!

    "Commune parente"
    commune: Commune!
  }
`
