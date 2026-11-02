/**
 * Giọng kể hoài cổ do Nam Bộ Ký Sự biên soạn, tách khỏi nguyên tác được dẫn trong journey-literature.
 * Chỉ dùng liên tưởng văn chương; tư liệu, mốc lịch sử và bản thu thuyết minh giữ nguyên.
 */
export type JourneyNarrative = {
  quote: string; opening: string; closing: string; bridges: Record<string, string>;
  epigraph?: string; allusion?: string;
};

export const journeyWelcome = {
  opening: 'Xin ghé lại bên một bến nước, dưới một mái ngói đã nhuốm màu năm tháng. Chuyến đi này lần theo những gì còn lưu hương của một thuở: nếp nhà, dáng chợ, tiếng đờn và lời ăn tiếng nói của con người phương Nam.',
  quote: 'Nước vẫn qua bến cũ, bóng người xưa đã khuất nẻo nào. Còn một tiếng gọi, một nếp nhà, một chút tài hoa gửi lại; người đi sau nhặt lấy mà thương.',
  invitation: 'Có thể bắt đầu từ một tiếng đò trong thơ cũ, rồi theo bóng nước mà vào chuyện đất, chuyện người. Đi chậm thôi, để một nét chạm chưa vội lướt qua, một lời xưa còn kịp ngân lại.',
  epigraph: 'song-lap',
};

export const journeyNarratives: Record<string, JourneyNarrative> = {
  'NBS-MAP-VEN-SONG': {
    quote: 'Phố tựa lưng vào chợ, chợ nghiêng bóng xuống sông. Qua mấy mái chùa, một bến nước, dáng Cần Thơ dần hiện giữa những lớp đời còn nối tiếp.',
    opening: 'Từ mái chùa Munir Ansay, bước chân lần ra phía sông. Hội quán, bến Ninh Kiều, mái chợ cổ rồi ghe hàng Cái Răng nối nhau mở chuyện. Mỗi nơi giữ một nếp người; mỗi lần dừng lại, thành phố lại gần thêm một chút.',
    closing: 'Đến chợ nổi, đường đi tạm khép mà dư âm còn theo mãi. Mai này gặp lại một bóng ghe, biết đâu ta sẽ nhớ cả bàn tay giữ lái, món hàng chờ bán, và một nếp sống cùng sông.',
    epigraph: 'song-lap',
    bridges: {
      'munir-ansay': 'Dáng mái chùa còn ở lại trong mắt, bước chân đã lần sang hội quán. Một cộng đồng khác sẽ kể tiếp chuyện tìm đất ở và giữ nếp quê.',
      'chua-ong': 'Rời khoảng sân khép, ra nơi trời nước rộng. Ninh Kiều đợi ở phía bến, chỗ câu chuyện của phố lại tìm về với sông.',
      'ben-ninh-kieu': 'Từ bến ngoái lại, mái chợ vào tầm mắt. Những cuộc đến đi rồi cũng có một chỗ dừng, một món hàng trao, một lời người quen gọi.',
      'cho-co': 'Qua mái ngói nhà lồng, câu chuyện theo hàng hóa xuống ghe. Cái Răng mở ra phía trước, giữa dòng nước và kế sinh nhai.',
    },
  },
  'NBS-MAP-LONG-TUYEN': {
    quote: 'Đình giữ việc làng, chùa lưu chuyện học, nhà gìn nếp ở. Ba lần qua cửa, người khách chậm chân mới nhận ra bao lớp đời nằm gần nhau đến thế.',
    opening: 'Về Bình Thủy, xin ghé đình trước, sang Nam Nhã rồi dừng ở nhà họ Dương. Đường đi lần theo một miền gần gũi, mà chuyện mở ra khi rộng đến việc làng, khi xa đến khát vọng học hành, khi gần lại một gian nhà.',
    closing: 'Qua ba ngưỡng cửa, dường như đã qua ba khoảng đời. Mái ngói còn đó để người sau nhận mặt, còn công gìn giữ nằm trong từng lần chăm nom, từng điều được trao lại.',
    epigraph: 'ban-den-nha',
    bridges: {
      'dinh-binh-thuy': 'Khép chuyện đình làng, sang mái Nam Nhã. Từ một chốn dừng chân, câu chuyện lại mở về những chuyến đi xa và lòng ham học.',
      'chua-nam-nha': 'Ước vọng đi xa còn ngân dưới mái chùa. Bây giờ xin ghé một ngôi nhà, gặp cách người ta dành chỗ cho gia đình và ký ức.',
    },
  },
  'NBS-DOC-TEN-DAT': {
    quote: 'Tên đất còn trên đầu lưỡi, chuyện cũ đã chia nhiều ngả. Theo một tiếng gọi quen mà lần về, gặp cả dấu bể dâu lẫn những điều chưa tỏ.',
    opening: 'Đầu Sấu, Cái Răng: mới đọc lên đã nghe như có chuyện đợi phía sau. Lời truyền tụng và dấu vết ghi chép cùng nằm trong cuộc tìm về ấy. Ta lần từng ngả, để tên quen mở thêm chiều sâu, còn điều chưa rõ vẫn có chỗ ở lại.',
    closing: 'Đường về khép lại mà tên đất vẫn còn theo. Có lời kể đã tìm thấy chỗ dựa, có ngả vẫn phủ một lớp sương. Lần sau đi qua, hẳn tiếng gọi quen sẽ có thêm một chút dư vang.',
    allusion: 'be-dau',
    bridges: {
      E020: 'Chuyện Đầu Sấu còn vương ở tên gọi. Sang Cái Răng, lại gặp những lối giải thích khác, mỗi lối cần được lần đến tận nguồn.',
      E021: 'Tên gọi đã mở mấy ngả chuyện xưa. Nay trở lại chợ nổi, gặp nơi chốn mang cái tên ấy giữa một đời sống còn tiếp diễn.',
    },
  },
  'NBS-DOC-NEP-NHA': {
    quote: 'Một mái nhà thành chốn trở về bởi những điều khó vẽ lên mặt giấy: lời thưa ở cửa, chỗ ngồi dành khách, ngày cùng nhớ một người xa.',
    opening: 'Từ buổi dạm ngõ đến ngày giỗ, rồi ghé nhà cổ Bình Thủy, chuyến đọc đi vào những khoảng gần của đời người. Có điều được nói trang trọng giữa hai nhà; có điều chỉ bền bỉ ở lại qua một nếp làm, một lần tưởng nhớ.',
    closing: 'Rời ngưỡng nhà người, lòng lại nhớ nhà mình. Biết bao điều quen đến nỗi ít ai ghi xuống, vậy mà qua những điều ấy, người sau vẫn nhận được một phần tính nết của người đi trước.',
    epigraph: 'cam-tho',
    bridges: {
      E001: 'Từ lời đầu hai nhà thưa chuyện, đi sang một cuộc sum họp khác. Trong ngày giỗ, chỗ dành cho người đã khuất lại nối người đang sống với nhau.',
      E008: 'Một nếp nhớ đã thành câu chuyện. Xin bước thêm qua cửa nhà Bình Thủy, nơi ký ức có cả hình dáng của một không gian ở.',
    },
  },
  'NBS-DOC-TIENG-QUE': {
    quote: 'Có tiếng đã nghe từ thuở nhỏ, đi xa mới biết mình mang theo. Bậu, qua, mần, bển, hổng: mấy âm gần gũi mà mở cả một khoảng người thân.',
    opening: 'Xin ngồi lại cùng mấy tiếng quen. Đặt bậu, qua, mần, bển, hổng vào từng lời nói, ta gặp cả người đang gọi, người được gọi và cái tình của hoàn cảnh. Nghĩa nằm trong mục từ, dư vị còn ở cách một câu được cất lên.',
    closing: 'Đọc hết mấy tiếng, chưa phải đã nghe hết tiếng quê. Lời nói còn ở ngoài trang chữ, trong giọng người và tình huống. Mang theo một âm quen, chuyến trở về có khi bắt đầu từ đó.',
    epigraph: 'loi-que',
    bridges: {
      E029: 'Tiếng bậu còn dành cho người đối diện. Đến tiếng qua, câu nói quay về phía người đang mở lời.',
      E030: 'Đã có người xưng, người gọi; xin sang một tiếng chỉ việc làm. Mần đưa câu chuyện gần thêm với công việc hằng ngày.',
      E031: 'Từ việc làm, lời nói mở ra một phía xa gần. Bển chỉ một nơi, mà điểm đứng của người nói cũng theo đó hiện lên.',
      E032: 'Một phía vừa gọi tên, một tiếng hổng đã có thể đổi nghĩa cả câu. Lời quê lại thêm một nét riêng để dừng mà nghe.',
    },
  },
  'NBS-DOC-LE-HOI': {
    quote: 'Năm tháng đi qua một cộng đồng bằng những ngày cùng sửa soạn. Mùa mới đến, ông bà được nhớ, vầng trăng lên; người này lại chỉ cho người kia một việc cần làm.',
    opening: 'Qua Chôl Chnăm Thmây, Sene Dolta, Oóc Om Bóc và đua ghe Ngo, thời gian hiện thành những cuộc cùng làm, cùng nhớ. Mỗi thực hành có tên gọi và ý nghĩa riêng; nếp tiếp nối nằm trong bàn tay đang chuẩn bị và người trẻ đứng bên học lấy.',
    closing: 'Một vòng đọc đã hết, vòng trao truyền còn tiếp. Có người đang làm việc mình từng được dạy, có người mới học lần đầu. Cứ thế, thời gian của cộng đồng lại được gìn giữ qua những cuộc cùng làm.',
    bridges: {
      E011: 'Từ những việc đón năm mới, câu chuyện chuyển về lòng tưởng nhớ. Sene Dolta mở một khoảng thời gian dành cho ông bà.',
      E010: 'Lòng nhớ người trước còn ở lại. Sang Oóc Om Bóc, lại gặp một cách cộng đồng gửi gắm sự biết ơn và những mong cầu của mình.',
      E012: 'Giữ riêng ý nghĩa của mùa lễ, rồi theo nhịp chèo sang hồ sơ ghe Ngo. Trên đường đua, công sức nhiều người sẽ cùng hiện ra.',
    },
  },
  'NBS-DOC-GIU-NGHE': {
    quote: 'Một tiếng đờn mong gặp tri âm; một mảnh nghề đợi người học lấy. Cái khéo còn lại được, cũng nhờ có người biết quý công phu gửi trong đó.',
    opening: 'Xin theo tiếng đờn ca tài tử sang sân khấu Rô Băm, rồi ghé bàn làm bánh pía. Mỗi nghề một phép làm, mỗi nghệ thuật một lối học. Dưới cái hay, cái khéo là tháng ngày tập luyện và bàn tay người trước còn được người sau nhớ đến.',
    closing: 'Rời cuộc đờn, sân khấu và bàn bánh, điều còn vương có lẽ là lòng quý một sự thành thạo. Những việc trông nhẹ nhàng khi đã thành nghề thường giữ trong mình bao buổi học chưa thành.',
    allusion: 'tri-am',
    bridges: {
      E018: 'Tiếng đờn vừa lắng, sân khấu Rô Băm mở ra. Công phu đổi hình thức, còn câu chuyện học và truyền nghề vẫn theo bước người xem.',
      E014: 'Rời ánh nhìn sân khấu, ghé công việc của đôi tay. Một mẻ bánh lại mở câu chuyện riêng về cái khéo cần được học, được giữ.',
    },
  },
  'NBS-DOC-LOI-XUA': {
    quote: 'Lần giở trang cũ, gặp tiếng người còn mới trong trí nhớ. Mực có thể nhạt đi, mà một câu nói vẫn tìm được đường sang đời sau.',
    opening: 'Có câu tục ngữ được giữ trong một bản in, có tiếng quen còn đi về giữa lời nói mỗi ngày. Chuyến đọc lần từ con chữ cũ sang vậy, vô, nghen; chậm một nhịp trước từng nghĩa, như người ghé án sách mà gặp lại một lời thân thuộc.',
    closing: 'Đèn trên trang sách đã tắt, dư lời còn chưa dứt. Một câu xưa qua mỗi lần được đọc lại đều có dịp gặp người mới; phần việc của người sau là giữ cho con chữ và nghĩa của nó được rõ ràng.',
    epigraph: 'truoc-den',
    bridges: {
      'NBS-TUCNGU-18': 'Trang cũ xin lần thêm một tờ. Câu tục ngữ sau vẫn cần được nhìn kỹ từng chữ như câu vừa đọc.',
      'NBS-TUCNGU-22': 'Khép hai câu đã thành dòng in, gặp một tiếng vẫn ở trong lời nói: vậy.',
      'NBS-TU-VAY': 'Từ một tiếng nối lời, xin sang tiếng vô. Câu nói mở thêm một hướng, người đọc lại cần nhận đúng chỗ đứng của người nói.',
      'NBS-TU-VO': 'Một tiếng chỉ hướng vừa đi qua, tiếng nghen ở cuối lời nhắc đã hướng về người đối diện.',
    },
  },
  'NBS-DOC-BEN-NHA': {
    quote: 'Từ bến nước về đến cửa nhà, đường đi thu gần mà tình người mở rộng. Ngoài kia gặp khách mua hàng; trong này đón người quen, rồi hai họ thưa chuyện.',
    opening: 'Theo chuyện bến Ninh Kiều sang chợ nổi, rồi trở vào lời mời cưới và buổi dạm ngõ. Phố chợ có cách gặp gỡ của phố chợ, gia đình có lời thưa của gia đình. Đi qua những cuộc mở lời ấy, ta nhận thêm một nét của đời sống.',
    closing: 'Dừng ở cuộc gặp hai nhà, ngoái lại đã qua một bến sông. Đường đọc từ rộng đến gần, còn điều nối những chặng ấy là cách người ta tìm đến, mở lời và dành chỗ cho nhau.',
    epigraph: 'ban-den-nha',
    bridges: {
      'NBS-NINH-KIEU': 'Từ bến nhìn sông, câu chuyện theo ghe hàng đến chợ nổi. Ở đó, một cuộc gặp còn đi cùng công việc mưu sinh.',
      'NBS-CHO-NOI': 'Rời chuyện bán mua trên sông, xin ghé một lời mời trong nhà. Khoảng cách đã gần hơn, cách mở lời cũng đổi khác.',
      E004: 'Lời mời đã gửi, cuộc gặp sẽ đến. Trong buổi dạm ngõ, hai gia đình dành cho nhau những lời thưa đầu tiên.',
    },
  },
  'KN-DOC-DAU-VET': {
    quote: 'Dưới lớp đất, trong trang sách, trên một nếp nhà còn đứng, thời gian để lại những cách nhớ khác nhau. Người khách đến sau lần từng dấu mà nhận mặt một thuở.',
    opening: 'Từ hiện vật Dốc Chùa qua hồ sơ Nguyễn Hữu Cảnh đến nhà cổ Bình Thủy, chuyến đọc gặp ba dáng vẻ của thời gian. Vật còn lại, điều được ghi và không gian được gìn giữ sẽ kể mỗi thứ một phần; ta ghé từng nơi, không vội nối những chỗ còn khuất.',
    closing: 'Đi qua mấy lớp dấu xưa, mới hay ký ức cũng cần một chỗ tựa: vật liệu, trang ghi, người gìn giữ. Còn được một dấu để lần về, người sau còn một dịp đến gần đời trước.',
    epigraph: 'loi-xua',
    bridges: {
      'KN-SAMPLE-DOC-CHUA': 'Rời dấu tích trong đất, xin mở một trang ghi chép. Hồ sơ Nguyễn Hữu Cảnh đưa câu chuyện sang một loại chứng cứ khác.',
      'NBS-NGUYEN-HUU-CANH': 'Gấp trang tư liệu, bước sang nếp nhà Bình Thủy. Thời gian lại hiện qua vật liệu, cách dựng và cách người ta ở.',
    },
  },
  'KN-DOC-CONG-DONG': {
    quote: 'Đất rộng giữ nhiều nếp người. Mỗi cộng đồng một tiếng gọi, một mùa nhớ, một cách sửa soạn; cùng đi qua năm tháng mà vẫn có điều riêng để trao lại.',
    opening: 'Từ Nguyên Tiêu Việt–Hoa sang một ghi nhận về Châu Giang, rồi qua trầu cau và Tết Khmer, xin ghé từng câu chuyện bằng sự thong thả của người đến thăm. Mỗi nơi có lời riêng cần được nghe trọn, mỗi việc làm có bối cảnh riêng cần được nhận rõ.',
    closing: 'Qua những cuộc gặp, điều đọng lại là sự gần gũi có nhiều dáng vẻ. Xin giữ nguyên tên gọi và câu chuyện của từng nơi, để lần tìm về sau còn nhận đúng người, đúng nếp.',
    bridges: {
      'KN-SAMPLE-NGUYEN-TIEU': 'Rời mùa Nguyên Tiêu, xin sang Châu Giang. Một địa bàn khác mở ra, cùng những ghi nhận cần được đọc trong đời sống riêng của nó.',
      'KN-SAMPLE-CHAU-GIANG': 'Tạm dừng ở một vùng đất, gặp một vật phẩm đi qua nhiều cuộc gặp: trầu cau.',
      E002: 'Hương vị của một vật phẩm còn vương trong chuyện kể. Sang Tết Khmer, nếp sửa soạn và ý nghĩa của từng việc lại mở ra theo cách riêng.',
    },
  },
  'KN-DOC-NGAP-NUOC': {
    quote: 'Nước đi qua rừng, qua đồng, rồi đến chỗ ghe hàng họp lại. Cùng một khoảng trời nước, mỗi nơi giữ một nhịp sống để người đi đường dừng mà nhận ra.',
    opening: 'Xin theo những trang về Cần Giờ, Tràm Chim, rồi trở lại sông nước Cái Răng. Tán rừng, khoảng ngập và ghe chợ thay nhau vào tầm mắt. Cảnh có vẻ liền một dải, mà cách nước nuôi sinh cảnh và đi vào sinh kế cần được đọc riêng từng nơi.',
    closing: 'Ra khỏi trang cuối, mặt nước vẫn còn trong trí. Lần gặp một cảnh sông rừng khác, có lẽ ta sẽ nhớ nhìn thêm chỗ cây bám, chỗ chim ở và công việc con người gửi vào dòng nước.',
    bridges: {
      'KN-CAN-GIO': 'Dáng rừng ngập mặn còn ở lại, trang Tràm Chim đã mở. Cũng theo nước mà đọc, nhưng sinh cảnh nay có câu chuyện riêng.',
      'KN-TRAM-CHIM': 'Rời chuyện sinh cảnh, xin theo nước về một kế sinh nhai. Chợ nổi Cái Răng hiện ra giữa ghe hàng và việc bán mua.',
    },
  },
  'NBS-LONG-HO-CO-CHIEN': {
    quote: 'Một nếp sách, một nếp nhà, một bàn tay làm nghề. Ba chỗ gửi lại công phu, để qua năm tháng người sau còn có điều nhận lấy.',
    opening: 'Xin ghé Văn Thánh Miếu, qua nhà Cai Cường rồi đến những lò Mang Thít. Chữ nghĩa, cách ở và công việc làm nghề dần mở thành chuyện người: ai đã gây dựng, ai từng sử dụng, ai còn đứng trước việc phải giữ lại điều gì.',
    closing: 'Lò gạch đã lùi sau trang cuối, còn nếp sách, nếp nhà như vẫn ở gần. Một miền đất có khi ở lại trong trí người khách bằng chút công phu nhỏ: nét chạm, một việc làm, một điều người sau còn biết quý.',
    epigraph: 'loi-xua',
    bridges: {
      'NBS-VAN-THANH-MIEU-VL': 'Rời chỗ cất sách và tưởng nhớ người thầy, xin ghé một gian nhà. Ký ức ở Cai Cường lại có hình dáng của đời sống gia đình.',
      'NBS-NHA-CO-CAI-CUONG': 'Từ gỗ, ngói của nếp nhà, câu chuyện sang lò nung. Ở Mang Thít, vẻ đẹp còn đi cùng nỗi lo và công việc của người làm nghề.',
    },
  },
  'NBS-THUY-DAO-TAY-NAM': {
    quote: 'Con kênh mở một nét dài, chuyện đất mở nhiều lớp sâu. Qua mùa hội, bóng rừng rồi dấu tích trong đất, người khách lần theo chút vang của những cuộc bể dâu.',
    opening: 'Từ kênh Vĩnh Tế, xin ghé mùa Vía Bà Chúa Xứ, vào trang rừng Trà Sư rồi dừng trước hiện vật Óc Eo. Công sức, niềm tin, sinh cảnh và dấu vết khảo cổ lần lượt hiện ra; mỗi chặng trao một góc nhìn cho chặng sau.',
    closing: 'Đến hiện vật cuối tuyến, bước đọc bỗng chậm hơn. Từ nét kênh trên bản đồ đến dấu tích nằm trong đất, bao lớp thời gian cần được lần lại. Chuyến đi tạm khép ở đây, chỗ câu hỏi còn ở cùng người khách.',
    allusion: 'be-dau',
    bridges: {
      'NBS-KENH-VINH-TE': 'Từ con kênh và công sức con người, xin sang núi Sam. Mùa lễ mở một khoảng khác của đời sống, nơi niềm tin được cùng nhau gìn giữ.',
      'NBS-VIA-BA-CHUA-XU': 'Dư âm mùa hội còn theo bước, bóng rừng đã mở trước trang. Ở Trà Sư, câu chuyện lại lần theo nhịp nước.',
      'NBS-RUNG-TRAM-TRA-SU': 'Rời nhịp nước theo mùa, đến những dấu vết cần đo bằng thước thời gian khác. Óc Eo đợi ở chặng sau, giữa hiện vật và điều còn phải tìm.',
    },
  },
};

export const journeyArrivals: Record<string, string> = {
  'munir-ansay': 'Dáng mái chùa giữa phố níu bước người qua. Từ một nét kiến trúc, câu chuyện lần đến cộng đồng đã dựng xây, gìn giữ và gửi những mùa lễ vào nơi chốn này.',
  'chua-ong': 'Qua cổng hội quán, đường nhìn đi vào trong mà chuyện mở về xa. Ký ức quê hương đã theo người đến đất mới, tìm một chỗ nương trong kiến trúc và đời sống cộng đồng.',
  'ben-ninh-kieu': 'Phố dừng ở bờ, tầm mắt còn theo nước. Giữa hai hướng ấy, bến Ninh Kiều giữ cho người khách một dáng Cần Thơ: có cuộc đến đi, có chỗ đứng mà ngoái lại.',
  'cho-co': 'Nhìn một mái chợ, dễ nhớ đến những cuộc hỏi han, bán mua dưới mái ấy. Ngói và cột còn đứng cho người sau nhận mặt; câu chuyện làm nên phố chợ vẫn cần lần về những đời người.',
  'cho-noi-cai-rang': 'Một bóng ghe chở hàng, cũng chở theo một nếp sống cùng sông. Đến đây, xin chậm lại trước chuyện người bán, người mua và công việc đã làm nên dáng chợ.',
  'dinh-binh-thuy': 'Qua ngưỡng đình, chuyện từng mái nhà mở thành việc làng. Những ngày cùng sửa soạn, những điều cùng tưởng nhớ đã dành cho người trong xóm một chỗ gặp nhau dưới mái ngói này.',
  'chua-nam-nha': 'Dưới mái Nam Nhã, câu chuyện có những nẻo hướng ra xa. Chốn dừng chân còn giữ dấu khát vọng học hành; theo tư liệu mà lần, mái chùa lại mở thêm một chiều sâu.',
  'nha-co-binh-thuy': 'Bước qua cửa, tiếng phố như lùi một quãng. Nếp nhà mở dần từ nơi đón khách đến chỗ thờ người trước; từng khoảng gần gũi giữ cho kiến trúc một phần hồn ở.',
  E020: 'Tên Đầu Sấu còn ở trên môi người gọi, chuyện phía sau đã mở nhiều ngả. Giữa lời truyền và dấu chép, người đến sau lần tìm từng mối, chưa vội khép một lời giải.',
  E021: 'Một cái tên theo nơi chốn qua nhiều đời, còn lời giải có khi đi những đường khác nhau. Đến Cái Răng, xin giữ cả lòng hiếu kỳ lẫn sự thong thả trước điều chưa tỏ.',
  'NBS-CHO-NOI': 'Ghe hàng vào trang đọc, cảnh chợ dần có thêm chiều sâu của công việc. Sau một món hàng là người làm, người chở, người đợi bán; sau dáng ghe là một kế sinh nhai.',
  E001: 'Một lời thưa ở cửa, chuyện đôi người thành chuyện hai nhà. Buổi dạm ngõ mở ra bằng những việc nhỏ mà trang trọng, để một mối gần gũi mới có chỗ bắt đầu.',
  E008: 'Người đã khuất có ngày được cùng nhớ, người đang sống có dịp ngồi gần nhau. Theo từng việc tư liệu ghi lại, một nếp giỗ dần hiện trong chuyện gia đình.',
  E029: 'Tiếng bậu vừa cất, người được gọi đã có một chỗ trong câu. Chữ trên trang giữ nghĩa; dư vị thân sơ còn đợi giọng nói và hoàn cảnh đưa về.',
  E030: 'Một tiếng qua, người nói tự đặt mình vào lời. Âm ngắn mà quan hệ trong câu đã có ngôi; đọc đến đây, chữ xưng cũng mang theo dáng người đang nói.',
  E031: 'Mần đi vào lời cùng một việc cần làm. Tiếng nói gần công việc, công việc lại gần đời người; từ một mục từ, câu chuyện thường ngày mở thêm một nét.',
  E032: 'Bển ở phía nào còn tùy người đứng bên này. Một tiếng chỉ nơi xa gần, mà trong đó đã có cả vị trí và hướng nhìn của người nói.',
  E033: 'Một tiếng hổng chen vào, nghĩa của câu đã đổi. Lời quê có những chỗ nhẹ như thế, phải đặt về đúng câu mới nhận rõ cái việc nó làm.',
  E011: 'Mùa mới mở bằng những việc cùng sửa soạn. Chôl Chnăm Thmây hiện qua người thực hành, qua điều được trao lại; thời gian của cộng đồng lại nối thêm một vòng.',
  E010: 'Lòng nhớ ông bà có những việc để gửi vào. Trong Sene Dolta, theo từng thực hành được ghi lại, người đọc gặp một cách cộng đồng giữ mối gần với người đi trước.',
  E012: 'Dưới tên một mùa trăng là những việc cùng làm, những niềm gửi gắm. Trang Oóc Om Bóc mở dần ý nghĩa riêng ấy, qua tiếng nói và thực hành của cộng đồng.',
  E013: 'Một nhịp chèo hiện ra từ công sức nhiều người. Trước khi câu chuyện tới đường đua, đã có những ngày cùng tập, cùng giữ nhịp; hồ sơ ghe Ngo bắt đầu từ đó.',
  E018: 'Tiếng đờn đi khỏi dây mà còn tìm một người hiểu ý. Mượn chuyện tri âm để vào cuộc đọc, ta gặp công phu của người diễn và sự tiếp nối của người học, người nghe.',
  E014: 'Một vai bước ra sân khấu, tháng ngày học nghề theo cùng. Dáng diễn ở trước mắt, công phu ở phía sau; Rô Băm mở câu chuyện về người gìn giữ nghệ thuật ấy.',
  E027: 'Chiếc bánh đã thành hình, bàn tay làm bánh còn một câu chuyện dài. Mẻ này nối mẻ khác, người học nhận từ người dạy cả thao tác lẫn những điều chỉ thành thạo qua công việc.',
  'NBS-TUCNGU-18': 'Một câu tục ngữ nằm trong bản in cũ, mực chữ còn đưa người đọc về gần lời xưa. Xin lần theo con chữ trước, rồi tới lời giải; ký ức cũng cần một bản văn rõ mặt.',
  'NBS-TUCNGU-22': 'Lại một dòng cũ, lại một lần gặp tiếng người qua trang sách. Câu tục ngữ giữ phần chữ đã in; nghĩa và hoàn cảnh sử dụng còn cần được đọc cho tỏ.',
  'NBS-TU-VAY': 'Vậy đi vào giữa lời, nhẹ đến nỗi người quen tiếng ít khi dừng lại. Đem tiếng ấy đặt về từng câu, mới nhận được mỗi chỗ nó góp vào nghĩa.',
  'NBS-TU-VO': 'Một tiếng vô mở một hướng đi. Hướng ấy gần hay xa, tới đâu, còn đợi điểm đứng của người đang nói; chữ ngắn vẫn mang theo cả một hoàn cảnh.',
  'NBS-TU-NGHEN': 'Ở cuối một lời nhắc, tiếng nghen như còn hướng về người nghe. Dư vị của câu ở đó, còn nghĩa cụ thể xin lần theo mục từ và ví dụ.',
  'NBS-NINH-KIEU': 'Từ phố nhìn ra, bến mở một khoảng trời nước. Từ sông ngoái lại, phố có một chỗ để nhận ra mình. Ninh Kiều đi vào câu chuyện ở giữa hai hướng nhìn ấy.',
  E004: 'Một lời mời rời cửa nhà này để tìm tới cửa nhà khác. Trước ngày vui, những mối quen được nhắc lại, những cuộc gặp được hẹn; nếp mời cưới mở chuyện từ đó.',
  'KN-SAMPLE-DOC-CHUA': 'Vật nhỏ nằm yên mà thời gian quanh nó đã dày. Từ hình dáng, chất liệu và nơi được tìm thấy, người nghiên cứu lần từng điều; dấu xưa kể trong phần chứng cứ còn giữ được.',
  'NBS-NGUYEN-HUU-CANH': 'Một tên người đi cùng một mốc sử, rồi ở lại trong cách người sau tưởng nhớ. Xin mở phần tư liệu trước, để chuyện ghi nhận và chuyện lưu danh hiện ra trong đúng lớp của mình.',
  'NBS-BINH-THUY': 'Bước qua cửa, tiếng phố như lùi một quãng. Nếp nhà mở dần từ nơi đón khách đến chỗ thờ người trước; từng khoảng gần gũi giữ cho kiến trúc một phần hồn ở.',
  'KN-SAMPLE-NGUYEN-TIEU': 'Một mùa Nguyên Tiêu hiện qua người cùng sửa soạn và những thực hành được ghi nhận. Mỗi cộng đồng có phần việc, bối cảnh riêng; đọc chậm để cuộc gặp còn giữ đủ những nét ấy.',
  'KN-SAMPLE-CHAU-GIANG': 'Tên Châu Giang đưa người khách đến một địa bàn cụ thể. Xin ghé lại cùng những ghi nhận về đời sống Chăm ở đây, để con người trong tư liệu hiện ra gần hơn một tên gọi chung.',
  E002: 'Miếng trầu đi qua nhiều cuộc gặp, mỗi lần lại ở trong một ý nghĩa riêng. Theo nguồn mà đọc, vật phẩm quen dần có thêm nét của quan hệ con người gửi vào đó.',
  'KN-CAN-GIO': 'Một màu xanh nhìn từ xa, nhiều khoảng sống khi lần theo tư liệu. Ở Cần Giờ, chuyện rừng mở xuống nơi cây bám và dòng nước đi qua, rồi rộng sang công việc gìn giữ.',
  'KN-TRAM-CHIM': 'Khoảng nước, khoảng đồng đi vào trang cùng nhịp sống riêng của Tràm Chim. Cảnh chỉ mới mở đầu; theo hồ sơ mà vào, người đọc còn gặp cách các phần sinh cảnh nương nhau.',
  'NBS-VAN-THANH-MIEU-VL': 'Án sách và chỗ thờ người thầy cùng giữ một nếp trọng chữ. Qua Văn Thánh Miếu, sự học có nơi lưu lại: trong sách, trong kiến trúc, trong cách người sau nhớ người trước.',
  'NBS-NHA-CO-CAI-CUONG': 'Ngoài hiên, hàng vòm đón mắt nhìn. Bên trong, nếp nhà dần đổi giọng: từ chỗ gặp khách tới nơi thờ tự. Qua mỗi ngưỡng cửa, cách ở gửi thêm một lớp nghĩa vào kiến trúc.',
  'NBS-GACH-GOM-MANG-THIT': 'Sắc gạch còn níu mắt, chuyện lò đã chạm tới đời người. Chất đốt, công việc, nỗi lo giữ hay bỏ đứng cùng cảnh quan; vẻ đẹp nơi này cần cả phần sinh kế để được hiểu cho trọn.',
  'NBS-KENH-VINH-TE': 'Nét kênh nằm dài trên bản đồ, bao công sức nằm sâu trong tư liệu. Lần theo điều được ghi, đường nước dần có chiều người; phía chưa tỏ vẫn còn đợi một cuộc tìm thêm.',
  'NBS-VIA-BA-CHUA-XU': 'Mùa lễ có ngày mở, ngày khép; việc trao truyền đi qua nhiều mùa như thế. Một người chỉ dẫn, một người học lấy, những lần cùng làm giữ cho lễ hội ở lại giữa đời sống.',
  'NBS-RUNG-TRAM-TRA-SU': 'Bóng tràm xuống nước, một màu xanh mở lối vào trang. Bên trong cảnh ấy là nhịp lên rút, nơi sinh vật tìm chỗ sống, và kế sinh nhai còn nối khu rừng với phía ngoài đê.',
  'NBS-OC-EO-BA-THE': 'Qua mấy cuộc bể dâu, còn một hiện vật để người sau cúi nhìn. Hình dáng và chất liệu mở lối hỏi về điều đã được làm, được dùng, được trao đổi; mỗi bước lần về cần đi cùng chứng cứ.',
};

export const journeyArrivalAllusions: Record<string, string> = {
  E018: 'tri-am', E020: 'be-dau', 'NBS-OC-EO-BA-THE': 'be-dau',
};
