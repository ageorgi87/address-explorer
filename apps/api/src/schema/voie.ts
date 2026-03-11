import { gql } from "graphql-tag";

export const voieTypeDefs = gql`
  "Voie (rue, avenue, etc.)"
  type Voie {
    "Identifiant unique"
    id: String!

    "Nom de la voie"
    nom: String!

    "Commune parente"
    commune: Commune!
  }
`;
