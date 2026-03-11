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

    "Numéros de la voie"
    numeros: [Numero!]!
  }

  "Numéro d'adresse"
  type Numero {
    "Identifiant unique"
    id: String!

    "Numéro"
    numero: String!

    "Suffixe (bis, ter, etc.)"
    suffixe: String

    "Latitude"
    lat: Float!

    "Longitude"
    lon: Float!
  }
`;
