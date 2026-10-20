const data = [
  // Rangos
  { cat: "RANGOS", group: "Guaicamacuto", num: "1", title: "Comisario o Comisaria Superior" },
  { cat: "RANGOS", group: "Guaicamacuto", num: "2", title: "Comisario o Comisaria Mayor" },
  { cat: "RANGOS", group: "Guaicamacuto", num: "3", title: "Comisario o Comisaria General" },
  { cat: "RANGOS", group: "Guaicamacuto", num: "4", title: "Comisario o Comisaria Jefe" },
  { cat: "RANGOS", group: "Guaicamacuto", num: "5", title: "Primer Comisario o Comisaria" },
  { cat: "RANGOS", group: "Guaicamacuto", num: "6", title: "Comisario o Comisaria" },
  { cat: "RANGOS", group: "Guaicamacuto", num: "7", title: "Inspector Jefe o Inspector Jefa" },
  { cat: "RANGOS", group: "Guaicamacuto", num: "8", title: "Primer Inspector o Primera Inspectora" },
  { cat: "RANGOS", group: "Guaicamacuto", num: "9", title: "Inspector o Inspectora" },
  { cat: "RANGOS", group: "Guaicamacuto", num: "10", title: "Oficial Jefe u Oficial Jefa" },
  { cat: "RANGOS", group: "Guaicamacuto", num: "11", title: "Primer Oficial" },
  { cat: "RANGOS", group: "Guaicamacuto", num: "12", title: "Oficial" },
  { cat: "RANGOS", group: "Guaicamacuto", num: "13", title: "Agente" },
  { cat: "RANGOS", group: "Guaicamacuto", num: "14", title: "Aspirante (CPNB)" },
  { cat: "RANGOS", group: "Conocayma", num: "S1", title: "Supervisor Estratégico" },
  { cat: "RANGOS", group: "Conocayma", num: "S2", title: "Supervisor General" },
  { cat: "RANGOS", group: "Conocayma", num: "S3", title: "Supervisor de..." },

  // Tiuna
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "1", title: "Prestar apoyo o ayuda" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "2", title: "Atención" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "3", title: "Copiado" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "4", title: "Llamada general de red" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "5", title: "Tomar nota" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "6", title: "Si no hay emergencia no llame" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "7", title: "Proceda de acuerdo a instrucciones" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "8", title: "Dar prioridad" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "9", title: "Canal abierto" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "10", title: "Quien comanda" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "11", title: "Quien trasmite" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "12", title: "Sin novedad" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "13", title: "Efectué llamada telefónica" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "14", title: "Recorra su área" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "15", title: "Verifique antecedentes de a) personas b) vehículos c) armas" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "16", title: "Cambie de canal" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "17", title: "Deje sin efecto" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "18", title: "Donde se encuentra" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "19", title: "Apague el transmisor" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "20", title: "Informe estoy copiando" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "21", title: "Reportarse unidad que está copiando" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "22", title: "Abastecimiento o equipar la unidad" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "23", title: "Como se escucha" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "24", title: "Se copia bien" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "25", title: "Se copia mal" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "26", title: "Cambie de sitio" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "27", title: "Permanezca en sintonía" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "28", title: "Positivo" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "29", title: "Negativo" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "30", title: "Procedimiento" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "31", title: "Verifique denuncia" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "32", title: "Tenga precaución" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "33", title: "Entrevístese con" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "34", title: "Informe resultado de" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "35", title: "Permanezca en el lugar" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "36", title: "Repita el mensaje" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "37", title: "Preste apoyo a..." },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "38", title: "De características de" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "39", title: "Efectué bloqueo" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "40", title: "Punto de control" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "41", title: "Intercepte" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "42", title: "Proceda a detención o decomiso" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "43", title: "Proteja la escena del suceso" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "44", title: "Déjese en libertad" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "45", title: "Detenga vehículo" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "46", title: "Se requiere comisión de" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "47", title: "Espere información" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "48", title: "Espere comisión de" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "49", title: "Entregue procedimiento a" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "50", title: "Retírese del lugar" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "51", title: "Lugar de servicio" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "52", title: "Relevo de servicio" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "53", title: "Evite pasar por" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "54", title: "Empleo de Updf. (uso progresivo y diferenciado de la fuerza)" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "55", title: "Disuelva la manifestación" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "56", title: "Utilice a) intermitente b) sirena c) megáfono" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "57", title: "Manténgase alejado del lugar y espere instrucciones" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "58", title: "Que espacio ocupan los manifestantes" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "59", title: "Informe actitud y situación" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "60", title: "Dinero en cualquiera de sus tipos o valor" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "61", title: "Agrupe la unidad y empléela en masa o bloque" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "62", title: "Despeje la vía para el libre tránsito" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "63", title: "Comisión personal (alimentación...)" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "64", title: "Quien ordena la comisión" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "65", title: "Informe novedades en el área de servicio" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "66", title: "Estado de alerta u orden de acuartelamiento" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "67", title: "Denunciante" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "68", title: "Denunciado" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "69", title: "Que se decomiso" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "70", title: "Donde condujo el procedimiento" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "71", title: "Se requiere unidad de remolque" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "72", title: "Consulte las claves" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "73", title: "Impongan sanción administrativa" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "74", title: "Ballena" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "75", title: "Vanguardia (de la marcha)" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "76", title: "Retaguardia (de la marcha)" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "77", title: "Grupo de respuesta inmediata (GRI)" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "78", title: "Pelotón de restablecimiento de orden público (PROP)" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "79", title: "Evento público" },
  { cat: "TIUNA", group: "Instrucciones de Servicio", num: "80", title: "Resguarde el comando" },

  // Pemon
  { cat: "PEMON", group: "Procedimientos Policiales", num: "1", title: "Atacan a" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "2", title: "Manifestación" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "3", title: "Concentración de personas" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "4", title: "Huelga" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "5", title: "Marcha pacífica" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "6", title: "Caminata" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "7", title: "Caravana" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "8", title: "Maratón" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "9", title: "Dispositivo de..." },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "10", title: "Evento cultural deportivo" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "11", title: "Excursión o plan vacacional" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "12", title: "Choque o colisión a) patrulla b) moto c) vehículo particular, d) helicóptero" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "13", title: "Motín" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "14", title: "Estudiante" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "15", title: "Muerto" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "16", title: "Lesionado" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "17", title: "Detenido" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "18", title: "Ciudadano" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "19", title: "Robo a) mano armada b) arrebatón" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "20", title: "Fiscal de guardia" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "21", title: "Ruidos molestos" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "22", title: "Sospechoso (a)" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "23", title: "Solicitado" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "24", title: "Riña" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "25", title: "Hurto" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "26", title: "Francotirador (es)" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "27", title: "Sujeto (s) encapuchado (s)" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "28", title: "Pancartas, panfletos, volantes" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "29", title: "Disparos" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "30", title: "Enfrentamiento con" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "31", title: "Artefactos explosivos" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "32", title: "Explosión" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "33", title: "Armas de fuego" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "34", title: "Armas blancas" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "35", title: "Objeto contundente" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "36", title: "Testigo (s)" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "37", title: "Entrega de citación de..." },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "38", title: "Inspección técnica" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "39", title: "Moto" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "40", title: "Vehículo" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "41", title: "Bicicleta" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "42", title: "Tsunami" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "43", title: "Derrumbe" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "44", title: "Incendio" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "45", title: "Inundación" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "46", title: "Venta ilícita de licor" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "47", title: "Deslave" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "48", title: "Precipitaciones" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "49", title: "Desbordamiento" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "50", title: "Sismo" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "51", title: "Mar de fondo" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "52", title: "Construcción prohibida" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "53", title: "Persona quemada" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "54", title: "Persona intoxicada" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "55", title: "Interferencia" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "56", title: "Persona extraviada" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "57", title: "Denuncia de..." },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "58", title: "Buhoneros o vendedores informales" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "59", title: "Accidente de tránsito" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "60", title: "Atropello" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "61", title: "Animal suelto en la vía" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "62", title: "Poste o árbol derribado" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "63", title: "Cables eléctricos en vía" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "64", title: "Solicita grúa" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "65", title: "Congestión de tráfico" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "66", title: "Motociclista" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "67", title: "Conductor ebrio" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "68", title: "Materiales en la vía" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "69", title: "Semáforo en mal estado" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "70", title: "Acuerdo entre partes" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "71", title: "Desvió de tránsito a" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "72", title: "Traslado de..." },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "73", title: "Personal de refuerzo" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "74", title: "Policía de servicio en" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "75", title: "Policía franco de servicio" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "76", title: "Daños en la calzada" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "77", title: "Vehículo mal estacionado" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "78", title: "Solicita comprobantes" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "79", title: "No porta documentos" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "80", title: "Operativo especial transito" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "81", title: "Salida de comisión" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "82", title: "Accidente aéreo" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "83", title: "Accidente ferroviario" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "84", title: "Trolebús dañado" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "85", title: "Robo" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "86", title: "Hurto" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "87", title: "Vehículo abandonado" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "88", title: "Unidad o vehículo accidentado" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "89", title: "Alarma de..." },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "90", title: "Violación, seducción actos lascivos" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "91", title: "Agresión o lesiones personales" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "92", title: "Secuestro" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "93", title: "Persona consumiendo" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "94", title: "Persona con antecedentes" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "95", title: "Persona (s) extraviada (s)" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "96", title: "Homicidio" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "97", title: "Suicidio" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "98", title: "Ahorcado" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "99", title: "Electrocutado" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "100", title: "Inmersión" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "101", title: "Envenenamiento" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "102", title: "Arrollamiento" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "103", title: "Accidente a) con muerto, b) con lesionado, c) con daños materiales" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "104", title: "Encunetamiento o embarrancamiento" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "105", title: "Aborto" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "106", title: "Feto" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "107", title: "Extorsión, estafa, fraude" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "108", title: "Apropiación indebida" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "109", title: "Cosas provenientes del delito" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "110", title: "Sustancias psicotrópicas y estupefacientes (drogas)" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "111", title: "Desobediencia a la autoridad" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "112", title: "Niño, niña o adolescente" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "113", title: "Mendigo" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "114", title: "Indigente" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "115", title: "Enajenado mental" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "116", title: "Comunidad (LGBTIQ+)" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "117", title: "Trabajadora sexual" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "118", title: "Violador o violadora" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "119", title: "Ebrio" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "120", title: "Juego de envite y azar" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "121", title: "Se niegan a cancelar" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "122", title: "Indocumentado" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "123", title: "Abandonado" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "124", title: "Ciudadano inconsciente en la vía" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "125", title: "Porte ilícito de armas" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "126", title: "Persona que se hace pasar por autoridad" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "127", title: "Distribuidor de drogas" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "128", title: "Competencia de motos o vehículos (piques)" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "129", title: "Motorizados en parejas" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "130", title: "Aposentamiento de seguridad y/o resguardo a" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "131", title: "Fuga de" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "132", title: "Ausencia de energía eléctrica" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "133", title: "Ausencia de suministro de agua" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "134", title: "Bote de aguas negras" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "135", title: "Bote de aguas blancas" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "136", title: "Acumulación de basura" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "137", title: "Animal muerto" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "138", title: "Maltrato animal" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "139", title: "Congestionamiento de tránsito" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "140", title: "Allanamiamiento" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "141", title: "Visita de..." },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "142", title: "Traslado a) plasma b) dinero c) detenido d) herido o enfermo" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "143", title: "Medida de desalojo" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "144", title: "Invasiones" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "145", title: "Se está observando desplazamiento de vehículos militares" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "146", title: "Privado de libertad" },
  { cat: "PEMON", group: "Procedimientos Policiales", num: "147", title: "Practicar prueba o examen" },

  // Wayuu & Warao
  { cat: "WAYUU", group: "Warao 1", num: "W1", title: "Ministerio del Poder Popular para las Relaciones Interiores, Justicia y Paz" },
  { cat: "WAYUU", group: "Wayuu", num: "1", title: "Palacio de Miraflores" },
  { cat: "WAYUU", group: "Wayuu", num: "2", title: "Residencia Presidencial" },
  { cat: "WAYUU", group: "Wayuu", num: "3", title: "Ministerio del Poder Popular de Agricultura y Tierras" },
  { cat: "WAYUU", group: "Wayuu", num: "4", title: "Ministerio del Poder Popular para la Alimentación" },
  { cat: "WAYUU", group: "Wayuu", num: "5", title: "Ministerio del Poder Popular del Ambiente" },
  { cat: "WAYUU", group: "Wayuu", num: "6", title: "Ministerio del Poder Popular para Ciencia, Tecnología e Industrias Intermedias" },
  { cat: "WAYUU", group: "Wayuu", num: "7", title: "Ministerio del Poder Popular para el Comercio" },
  { cat: "WAYUU", group: "Wayuu", num: "8", title: "Ministerio del Poder Popular para la Comunicación e Información" },
  { cat: "WAYUU", group: "Wayuu", num: "9", title: "Ministerio del Poder Popular para la Cultura" },
  { cat: "WAYUU", group: "Wayuu", num: "10", title: "Ministerio del Poder Popular para la Defensa" },
  { cat: "WAYUU", group: "Wayuu", num: "11", title: "Ministerio del Poder Popular para el Deporte" },
  { cat: "WAYUU", group: "Wayuu", num: "12", title: "Ministerio del Poder Popular para el Despacho de la Presidencia" },
  { cat: "WAYUU", group: "Wayuu", num: "13", title: "Ministerio del Poder Popular para la Educación" },
  { cat: "WAYUU", group: "Wayuu", num: "14", title: "Ministerio del Poder Popular para la Educación Superior" },
  { cat: "WAYUU", group: "Wayuu", num: "15", title: "Ministerio del Poder Popular de Energía y Petróleo" },
  { cat: "WAYUU", group: "Wayuu", num: "16", title: "Ministerio del Poder Popular para las Comunas" },
  { cat: "WAYUU", group: "Wayuu", num: "17", title: "Ministerio del Poder Popular para las Finanzas" },
  { cat: "WAYUU", group: "Wayuu", num: "18", title: "Ministerio del Poder Popular para las Industrias Básicas y la Minería" },
  { cat: "WAYUU", group: "Wayuu", num: "19", title: "Ministerio del Poder Popular para las Obras Públicas y Vivienda" },
  { cat: "WAYUU", group: "Wayuu", num: "20", title: "Ministerio del Poder Popular para la Planificación y Desarrollo" }
];

const radioData = [
  { num: "0", title: "ATENCION" },
  { num: "1", title: "UBICACIÓN O DIRECCION" },
  { num: "2", title: "TOMAR NOTA" },
  { num: "3", title: "INVESTIGACION, AVERIGUAL O INDAGAR" },
  { num: "4", title: "ESPERAR O HACER ESPERAR" },
  { num: "5", title: "PROCEDIMIENTO POLICIAL" },
  { num: "6", title: "DESCRIPCION ALERTA DEL PROCEDIMIENTO" },
  { num: "7", title: "VERIFICACION DE ANTECEDENTE" },
  { num: "8", title: "REVICION FISICA, CIUDADANO, VEHICULO, CASA" },
  { num: "9", title: "DEJE SIN EFECTO" },
  { num: "10", title: "DISPONIBLE O DISPONIBILIDAD" },
  { num: "11", title: "CAMBIO DE CANAL" },
  { num: "12", title: "LLAMADA TELEFONICA" },
  { num: "13", title: "CONVERSACION O DIALOGO" },
  { num: "14", title: "ENTENDIDO O POSITIVO" },
  { num: "15", title: "NEGATIVO" },
  { num: "16", title: "CONTINUACION EN LA COMUNICACION" },
  { num: "17", title: "INTERFERENCIA EN LA COMUNICACION" },
  { num: "18", title: "COMO SE ESCUCHA O SE RECIBE" },
  { num: "19", title: "REPITA LA COMUNICACIÓN, LA INFORMACION O DATO" },
  { num: "20", title: "CENTRAL DE COMUNICACIÓN O PUESTO DE MANDO" },
  { num: "21", title: "OFICINA OPERATIVA" },
  { num: "22", title: "OFICINA ADMINISTRATIVA" },
  { num: "23", title: "CEFOPOL" },
  { num: "24", title: "TALLER DE PATRULLAS O MOTOS" },
  { num: "25", title: "HOSPITAL, CLINICA, AMBULATORIO, ETC." },
  { num: "26", title: "C.I.C.P.C." },
  { num: "27", title: "SEBIN" },
  { num: "28", title: "GUARDIA NACIONAL BOLIVARIANA" },
  { num: "29", title: "FUERZA ARMADA NACIONAL BOLIVARIANA" },
  { num: "30", title: "ARMADA NACIONAL BOLIVARIANA" },
  { num: "31", title: "EJERCITO NACIONAL BOLIVARIANO" },
  { num: "32", title: "PROTECCION CIVIL" },
  { num: "33", title: "BOMBEROS" },
  { num: "34", title: "CENTRO DE ARRESTO" },
  { num: "35", title: "CARCEL NACIONAL" },
  { num: "36", title: "ALCALDIA" },
  { num: "37", title: "GOBERNACION" },
  { num: "38", title: "RESIDENCIA DE LA REPUBLICA" },
  { num: "39", title: "FISCALIA DEL MINISTERIO" },
  { num: "40", title: "TRIBUNALES DE JUSTICIA" },
  { num: "41", title: "MINISTERIO" },
  { num: "42", title: "FUNCIONARIO POLICIAL" },
  { num: "43", title: "FUNCIONARIO PUBLICO" },
  { num: "44", title: "DENUNCIA" },
  { num: "45", title: "DIRIGIRSE, TRASLADO" },
  { num: "46", title: "INSTRUCCIÓN" },
  { num: "47", title: "EXPEDIENTE" },
  { num: "48", title: "SIN NOVEDAD" },
  { num: "49", title: "PATRULLAJE" },
  { num: "50", title: "SEGUNDO DE ALGUIEN" },
  { num: "51", title: "COMUNICACIÓN DE SERVICIO" },
  { num: "52", title: "FRANCO DE SERVICIO" },
  { num: "53", title: "NO LABORAR EN LA INSTITUCION" },
  { num: "54", title: "COMIDA O ACCION DE COMER" },
  { num: "55", title: "DINERO" },
  { num: "56", title: "SITIO O LUGAR" },
  { num: "57", title: "PROCEDENCIA" },
  { num: "58", title: "CIUDADANO" },
  { num: "59", title: "NIÑO, ADOLESCENTE" },
  { num: "60", title: "ANIMAL" },
  { num: "61", title: "UNIDAD, RADIO, PATRULLAJE" },
  { num: "62", title: "VEHICULO" },
  { num: "63", title: "MOTOCICLETA" },
  { num: "64", title: "BICICLETA" },
  { num: "65", title: "TRICICLO" },
  { num: "66", title: "EMBARCACION" },
  { num: "67", title: "HELICOPTERO" },
  { num: "68", title: "AERONAVE" },
  { num: "69", title: "ESTAFA" },
  { num: "70", title: "EXTORCION" },
  { num: "71", title: "SECUESTRO" },
  { num: "72", title: "HOMICIDIO" },
  { num: "73", title: "SUICIDIO" },
  { num: "74", title: "DROGA" },
  { num: "75", title: "RIÑA" },
  { num: "76", title: "RETIRADA O HUIDA" },
  { num: "77", title: "HURTO" },
  { num: "78", title: "ROBO" },
  { num: "79", title: "DISPARO" },
  { num: "80", title: "MUERTO" },
  { num: "81", title: "ARMA DE FUEGO" },
  { num: "82", title: "ARMA BLANCA" },
  { num: "83", title: "OBJETO CONTUNDENTE" },
  { num: "84", title: "PORTE ILISITO" },
  { num: "85", title: "INCENDIO" },
  { num: "86", title: "EXPLOSION" },
  { num: "87", title: "ARTEFACTO EXPLOSIVO" },
  { num: "88", title: "EMERGENCIA MEDICA" },
  { num: "89", title: "AMBULANCIA" },
  { num: "90", title: "HOMOSEXUAL" },
  { num: "91", title: "HERIDO" },
  { num: "92", title: "ENFERMO MENTAL" },
  { num: "93", title: "CHOQUE" },
  { num: "94", title: "EXCESO DE VELOCIDAD" },
  { num: "95", title: "CONGESTION DE TRANSITO" },
  { num: "96", title: "PLACA" },
  { num: "97", title: "INFRACCION DE TRANSITO" },
  { num: "98", title: "SOSPECHOSO" },
  { num: "99", title: "SOLICITADO" },
  { num: "100", title: "APOYO POLICIAL" }
].map(item => ({ ...item, cat: "RADIO", group: "Claves radio" }));

const phoneticAlphabet = [
  ["A", "Alfa"], ["B", "Bravo"], ["C", "Carlos"], ["D", "Delta"],
  ["E", "Eco"], ["F", "Foltrox"], ["G", "Golfo"], ["H", "Hotel"],
  ["I", "India"], ["J", "Julieta"], ["K", "Kilo"], ["L", "Lima"],
  ["M", "Miguel"], ["N", "Noviembre"], ["O", "Oscar"], ["P", "Papa"],
  ["Q", "Quebe"], ["R", "Romeo"], ["S", "Sierra"], ["T", "Tango"],
  ["U", "Uniforme"], ["V", "Victor"], ["W", "Wisky"], ["X", "Xiomara"],
  ["Y", "Yanky"], ["Z", "Zulu"]
];

function getPinnedItems() {
  return JSON.parse(localStorage.getItem('pinnedItems') || '[]');
}

function savePinnedItems(items) {
  localStorage.setItem('pinnedItems', JSON.stringify(items));
}

function togglePin(item) {
  let pinned = getPinnedItems();
  const index = pinned.findIndex(p => p.id === item.id);
  if (index >= 0) {
    pinned.splice(index, 1);
  } else {
    pinned.push(item);
  }
  savePinnedItems(pinned);
}

let currentFilter = null;
let showingAlphabet = false;
const normalizeText = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function renderCards(items) {
  const container = document.getElementById('cardsContainer');
  const noResults = document.getElementById('noResults');
  const resultsPanel = document.getElementById('resultsPanel');
  container.innerHTML = '';
  resultsPanel.hidden = items.length === 0 && !document.getElementById('searchInput').value.trim();

  if (items.length === 0) {
    noResults.style.display = resultsPanel.hidden ? 'none' : 'block';
    return;
  }

  resultsPanel.hidden = false;
  noResults.style.display = 'none';

  const pinnedItems = getPinnedItems();

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';

    const itemId = `key-${item.cat}-${item.num}-${normalizeText(item.title)}`;
    const isPinned = pinnedItems.some(p => p.id === itemId);

    card.innerHTML = `
      <div class="item-num">${item.num}</div>
      <div class="item-info">
        <div class="item-category">${item.cat} • ${item.group}</div>
        <div class="item-title">${item.title}</div>
      </div>
      <button type="button" class="btn-pin ${isPinned ? 'pinned' : ''}" style="margin-left: auto;">
        <svg class="icon pin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="width: 16px; height: 16px;">
          <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z"></path>
        </svg>
      </button>
    `;

    const pinBtn = card.querySelector('.btn-pin');
    pinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pinObj = {
        id: itemId,
        type: 'CLAVE',
        title: `${item.cat} (${item.num}): ${item.title}`,
        text: `Categoría: ${item.cat} | Grupo: ${item.group}`
      };
      togglePin(pinObj);
      const currentlyPinned = getPinnedItems().some(p => p.id === itemId);
      pinBtn.classList.toggle('pinned', currentlyPinned);
    });

    container.appendChild(card);
  });
}

function filterData() {
  const query = normalizeText(document.getElementById('searchInput').value.trim());

  if (showingAlphabet) {
    renderAlphabet(query);
    return;
  }

  if (!query && !currentFilter) {
    renderCards([]);
    return;
  }

  const searchableData = currentFilter === 'RADIO'
    ? radioData
    : currentFilter
      ? data
      : [...data, ...radioData];
  const filtered = searchableData.filter(item => {
    const matchesCat = (!currentFilter || item.cat === currentFilter);
    const matchesQuery = normalizeText(item.title).includes(query) ||
                         normalizeText(item.num).includes(query) ||
                         normalizeText(item.group).includes(query) ||
                         normalizeText(`${item.cat} ${item.num}`).includes(query) ||
                         normalizeText(`${item.title} ${item.num}`).includes(query);

    return matchesCat && matchesQuery;
  });

  document.getElementById('resultsHeading').textContent = currentFilter
    ? `Resultados: ${currentFilter === 'RADIO' ? 'Claves radio' : currentFilter}`
    : 'Resultados de búsqueda';
  renderCards(filtered);
}

function setFilter(cat) {
  currentFilter = cat;
  showingAlphabet = false;
  document.getElementById('searchInput').value = '';
  document.getElementById('cardsContainer').hidden = false;
  document.getElementById('phoneticTable').hidden = true;
  document.getElementById('sectionMenu').classList.remove('open');
  document.getElementById('menuToggle').setAttribute('aria-expanded', 'false');
  document.getElementById('keysMenuGroup').classList.remove('expanded');
  document.getElementById('keysMenuToggle').setAttribute('aria-expanded', 'false');
  filterData();
}

function renderAlphabet(query = '') {
  const tableBody = document.getElementById('phoneticTableBody');
  const table = document.getElementById('phoneticTable');
  const cards = document.getElementById('cardsContainer');
  const noResults = document.getElementById('noResults');
  const resultsPanel = document.getElementById('resultsPanel');
  const filteredAlphabet = phoneticAlphabet.filter(([letter, code]) =>
    normalizeText(`${letter} ${code}`).includes(query)
  );

  document.getElementById('resultsHeading').textContent = 'Alfabeto fonético';
  cards.hidden = true;
  table.hidden = false;
  resultsPanel.hidden = false;
  tableBody.innerHTML = '';

  filteredAlphabet.forEach(([letter, code]) => {
    const row = document.createElement('tr');
    const letterCell = document.createElement('td');
    const codeCell = document.createElement('td');
    letterCell.textContent = letter;
    codeCell.textContent = code;
    row.append(letterCell, codeCell);
    tableBody.appendChild(row);
  });

  noResults.style.display = filteredAlphabet.length ? 'none' : 'block';
}

function showAlphabet() {
  currentFilter = null;
  showingAlphabet = true;
  document.getElementById('searchInput').value = '';
  document.getElementById('sectionMenu').classList.remove('open');
  document.getElementById('menuToggle').setAttribute('aria-expanded', 'false');
  document.getElementById('keysMenuGroup').classList.remove('expanded');
  document.getElementById('keysMenuToggle').setAttribute('aria-expanded', 'false');
  renderAlphabet();
}

document.getElementById('sectionMenu').addEventListener('click', event => {
  const button = event.target.closest('[data-filter], [data-action="alphabet"]');
  if (!button) return;

  if (button.dataset.filter) {
    setFilter(button.dataset.filter);
  } else {
    showAlphabet();
  }
});

document.getElementById('keysMenuToggle').addEventListener('click', () => {
  const group = document.getElementById('keysMenuGroup');
  const isExpanded = group.classList.toggle('expanded');
  document.getElementById('keysMenuToggle').setAttribute('aria-expanded', String(isExpanded));
});

document.getElementById('menuToggle').addEventListener('click', () => {
  const menu = document.getElementById('sectionMenu');
  const isOpen = menu.classList.toggle('open');
  document.getElementById('menuToggle').setAttribute('aria-expanded', String(isOpen));
});

document.addEventListener('click', event => {
  const menu = document.getElementById('sectionMenu');
  const menuToggle = document.getElementById('menuToggle');
  if (
    menu.classList.contains('open') &&
    !menu.contains(event.target) &&
    !menuToggle.contains(event.target)
  ) {
    menu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
});

const infoDialog = document.getElementById('infoDialog');
const infoDialogTitle = document.getElementById('infoDialogTitle');
const infoDialogMessage = document.getElementById('infoDialogMessage');

function showInfoDialog(title, message) {
  document.getElementById('sectionMenu').classList.remove('open');
  document.getElementById('menuToggle').setAttribute('aria-expanded', 'false');
  infoDialogTitle.textContent = title;
  infoDialogMessage.textContent = message;
  infoDialog.showModal();
}

document.getElementById('termsButton').addEventListener('click', () => {
  showInfoDialog(
    'Protocolo y términos de esta herramienta',
    'Esta aplicación web está diseñada para la gestión y consulta de estudiantes de la UNES y/o funcionarios que deseen facilitar la búsqueda de artículos, claves y otros recursos disponibles. La información se ofrece como apoyo de consulta; verifica siempre las fuentes oficiales y la normativa vigente.'
  );
});

document.getElementById('loginButton').addEventListener('click', () => {
  showInfoDialog(
    'Login no disponible',
    'Este web/app aún no está listo para usuarios. Por favor, intente más adelante.'
  );
});

document.getElementById('infoDialogClose').addEventListener('click', () => {
  infoDialog.close();
});

// Modal de elementos fijados
const pinnedDialog = document.getElementById('pinnedDialog');
const pinnedListContainer = document.getElementById('pinnedListContainer');
const openPinnedButton = document.getElementById('openPinnedButton');
const pinnedDialogClose = document.getElementById('pinnedDialogClose');

function renderPinnedModal() {
  pinnedListContainer.innerHTML = '';
  const pinnedItems = getPinnedItems();

  if (pinnedItems.length === 0) {
    pinnedListContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No tienes elementos fijados aún.</p>';
    return;
  }

  pinnedItems.forEach(item => {
    const card = document.createElement('article');
    card.className = 'article-result';
    card.innerHTML = `
      <div style="font-size:0.75rem; font-weight:bold; color:var(--text-muted); text-transform:uppercase;">${item.type}</div>
      <h2>${item.title}</h2>
      <p>${item.text}</p>
      <button type="button" class="btn-pin pinned">
        <svg class="icon pin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="width: 16px; height: 16px;">
          <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z"></path>
        </svg>
        <span>Desfijar</span>
      </button>
    `;

    card.querySelector('.btn-pin').addEventListener('click', () => {
      togglePin(item);
      renderPinnedModal();
    });

    pinnedListContainer.appendChild(card);
  });
}

if (openPinnedButton) {
  openPinnedButton.addEventListener('click', () => {
    renderPinnedModal();
    pinnedDialog.showModal();
  });
}

if (pinnedDialogClose) {
  pinnedDialogClose.addEventListener('click', () => {
    pinnedDialog.close();
  });
}

document.getElementById('searchInput').addEventListener('input', () => {
  if (showingAlphabet) {
    document.getElementById('cardsContainer').hidden = true;
    document.getElementById('phoneticTable').hidden = false;
  }
  filterData();
});

renderCards([]);
