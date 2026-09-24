alter table public.representantes add column if not exists abrangencia text;
insert into public.representantes (nome,empresa,estado,abrangencia,telefone,whatsapp,email,ordem,ativo) values
('Leonardo / Anelize','Five Representações','RS',null,'(48) 98455-9095','(48) 98455-9095','vendasfiverepresentacoes@gmail.com',1,true),
('Marcos','Irineu Mattivi Representações','SC',null,'(48) 98835-0614','(48) 98835-0614','irineu.mattivi@gmail.com',2,true),
('Edvilson','Qualit Representações','PR',null,'(43) 3344-1090','(43) 99922-0102','edvilson@qualitrep.com.br',3,true),
('Cláudio','Cabukem Representações','SP','Grande SP e RJ','(11) 2438-8157','(11) 95619-0485','cabukem@cabukem.com.br',4,true),
('Cláudio','TCJ Balieiro Assessoria e Representações','SP','Interior de SP','(19) 99799-1768','(19) 99799-1768','claudiotcj@bol.com.br',5,true),
('Alessandro','Central Minas Freios','MG','BH e Região Metropolitana','(31) 99108-2966','(31) 99108-2966','alessandro@centralminasfreios.com.br',6,true),
('Alencar','Ducleumartes','MG','Demais regiões de MG, GO e DF','(34) 99971-4565','(62) 99600-0107','alencar.representacoes@gmail.com',7,true),
('Marcelo Ortmeyer',null,'ES',null,'(48) 9177-4284','(48) 9177-4284','marcelo.ortmeyer@fluair.com.br',8,true),
('Weslley','Imbica Representações','MT',null,'(67) 99130-1260','(67) 99130-1260','fluair@fluair.com.br',9,true),
('Anderson','Representações Marinho','MS',null,'(67) 99264-4380','(67) 99264-4380','representacoesmarinhoms@hotmail.com',10,true),
('Marcelo Ortmeyer',null,'RO',null,'(48) 9177-4284','(48) 9177-4284','marcelo.ortmeyer@fluair.com.br',11,true),
('Naldo / Edilene','EDM Representações Ltda','PA','AP, RR, MA, AM e PA (exceto Sul do PA)','(91) 99144-6150','(91) 99114-4702','atendimentoedm@hotmail.com',12,true),
('Raimundo','Rosado & Rosado','TO','TO e Sul do PA','(63) 3602-2658','(63) 99213-4646','rosadorep21@gmail.com',13,true),
('Marcelo Ortmeyer',null,'AC',null,'(48) 9177-4284','(48) 9177-4284','marcelo.ortmeyer@fluair.com.br',14,true),
('Marcelo Ortmeyer',null,'BA','PI, CE, AL, SE e BA','(48) 9177-4284','(48) 9177-4284','marcelo.ortmeyer@fluair.com.br',15,true),
('Edson','Imagem Representações','PE','RN, PB e PE','(84) 98131-5961','(84) 98805-8024','edsonimagemrepresentacoes@hotmail.com',16,true);