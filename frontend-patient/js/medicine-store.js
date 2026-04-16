const MEDICINES=[
{name:"Paracetamol",generic:"Acetaminophen",cat:"Pain & Fever",uses:"Fever, headache, body pain, mild pain relief",rx:false,img:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Paracetamol_tablets.jpg/320px-Paracetamol_tablets.jpg"},
{name:"Ibuprofen",generic:"Ibuprofen",cat:"Pain & Fever",uses:"Pain, inflammation, fever, arthritis",rx:false,img:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Ibuprofen_200mg_Tablets.jpg/320px-Ibuprofen_200mg_Tablets.jpg"},
{name:"Aspirin",generic:"Acetylsalicylic Acid",cat:"Pain & Fever",uses:"Pain, fever, blood thinning",rx:false,img:"https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Aspirin_tablets.jpg/320px-Aspirin_tablets.jpg"},
{name:"Diclofenac",generic:"Diclofenac Sodium",cat:"Pain & Fever",uses:"Joint pain, muscle pain, arthritis",rx:true,img:""},
{name:"Nimesulide",generic:"Nimesulide",cat:"Pain & Fever",uses:"Fever, pain, inflammation",rx:true,img:""},
{name:"Aceclofenac",generic:"Aceclofenac",cat:"Pain & Fever",uses:"Arthritis, back pain, dental pain",rx:true,img:""},
{name:"Tramadol",generic:"Tramadol HCl",cat:"Pain & Fever",uses:"Moderate to severe pain",rx:true,img:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Tramadol_50mg_capsules.jpg/320px-Tramadol_50mg_capsules.jpg"},
{name:"Mefenamic Acid",generic:"Mefenamic Acid",cat:"Pain & Fever",uses:"Menstrual pain, mild to moderate pain",rx:true,img:""},
{name:"Naproxen",generic:"Naproxen",cat:"Pain & Fever",uses:"Arthritis, menstrual cramps, gout",rx:false,img:""},
{name:"Ketorolac",generic:"Ketorolac",cat:"Pain & Fever",uses:"Short-term pain relief, post-surgery",rx:true,img:""},
{name:"Amoxicillin",generic:"Amoxicillin",cat:"Antibiotics",uses:"Bacterial infections, throat, ear, pneumonia",rx:true,img:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Amoxicillin_capsules.jpg/320px-Amoxicillin_capsules.jpg"},
{name:"Azithromycin",generic:"Azithromycin",cat:"Antibiotics",uses:"Respiratory infections, skin infections",rx:true,img:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Azithromycin_250_mg_tablets.jpg/320px-Azithromycin_250_mg_tablets.jpg"},
{name:"Ciprofloxacin",generic:"Ciprofloxacin",cat:"Antibiotics",uses:"UTI, diarrhea, respiratory infections, typhoid",rx:true,img:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Ciprofloxacin_500mg_tablets.jpg/320px-Ciprofloxacin_500mg_tablets.jpg"},
{name:"Doxycycline",generic:"Doxycycline",cat:"Antibiotics",uses:"Malaria prevention, acne, respiratory infections",rx:true,img:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Doxycycline_100mg_capsules.jpg/320px-Doxycycline_100mg_capsules.jpg"},
{name:"Metronidazole",generic:"Metronidazole",cat:"Antibiotics",uses:"Bacterial and parasitic infections",rx:true,img:""},
{name:"Cefixime",generic:"Cefixime",cat:"Antibiotics",uses:"Ear infections, UTI, typhoid",rx:true,img:""},
{name:"Levofloxacin",generic:"Levofloxacin",cat:"Antibiotics",uses:"Pneumonia, sinusitis, UTI",rx:true,img:""},
{name:"Clarithromycin",generic:"Clarithromycin",cat:"Antibiotics",uses:"Respiratory infections, H. pylori",rx:true,img:""},
{name:"Amoxicillin-Clavulanate",generic:"Co-Amoxiclav",cat:"Antibiotics",uses:"Resistant bacterial infections, sinusitis",rx:true,img:""},
{name:"Cefuroxime",generic:"Cefuroxime",cat:"Antibiotics",uses:"Respiratory, skin, UTI infections",rx:true,img:""},
{name:"Omeprazole",generic:"Omeprazole",cat:"Digestive",uses:"Acidity, GERD, stomach ulcers, heartburn",rx:false,img:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Omeprazole_20mg_capsules.jpg/320px-Omeprazole_20mg_capsules.jpg"},
{name:"Pantoprazole",generic:"Pantoprazole",cat:"Digestive",uses:"Acid reflux, peptic ulcer, GERD",rx:true,img:""},
{name:"Domperidone",generic:"Domperidone",cat:"Digestive",uses:"Nausea, vomiting, bloating, indigestion",rx:true,img:""},
{name:"Ondansetron",generic:"Ondansetron",cat:"Digestive",uses:"Nausea and vomiting",rx:true,img:""},
{name:"Metoclopramide",generic:"Metoclopramide",cat:"Digestive",uses:"Nausea, vomiting, gastroparesis",rx:true,img:""},
{name:"Loperamide",generic:"Loperamide",cat:"Digestive",uses:"Diarrhea, IBS",rx:false,img:""},
{name:"ORS Sachet",generic:"Oral Rehydration Salts",cat:"Digestive",uses:"Dehydration from diarrhea, vomiting",rx:false,img:""},
{name:"Lactulose",generic:"Lactulose",cat:"Digestive",uses:"Constipation, hepatic encephalopathy",rx:false,img:""},
{name:"Isabgol",generic:"Psyllium Husk",cat:"Digestive",uses:"Constipation, IBS, cholesterol",rx:false,img:""},
{name:"Ranitidine",generic:"Ranitidine",cat:"Digestive",uses:"Heartburn, acid indigestion, stomach ulcers",rx:false,img:""},
{name:"Cetirizine",generic:"Cetirizine HCl",cat:"Allergy & Cold",uses:"Allergic rhinitis, urticaria, hay fever",rx:false,img:"https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Cetirizine_10mg_tablets.jpg/320px-Cetirizine_10mg_tablets.jpg"},
{name:"Loratadine",generic:"Loratadine",cat:"Allergy & Cold",uses:"Allergies, hay fever, hives",rx:false,img:""},
{name:"Fexofenadine",generic:"Fexofenadine",cat:"Allergy & Cold",uses:"Seasonal allergies, chronic urticaria",rx:false,img:""},
{name:"Montelukast",generic:"Montelukast",cat:"Allergy & Cold",uses:"Asthma, allergic rhinitis",rx:true,img:""},
{name:"Chlorpheniramine",generic:"Chlorpheniramine Maleate",cat:"Allergy & Cold",uses:"Cold, allergy, runny nose",rx:false,img:""},
{name:"Levocetirizine",generic:"Levocetirizine",cat:"Allergy & Cold",uses:"Allergic rhinitis, chronic urticaria",rx:false,img:""},
{name:"Desloratadine",generic:"Desloratadine",cat:"Allergy & Cold",uses:"Allergies, hives, hay fever",rx:false,img:""},
{name:"Phenylephrine",generic:"Phenylephrine",cat:"Allergy & Cold",uses:"Nasal congestion, sinus pressure",rx:false,img:""},
{name:"Metformin",generic:"Metformin HCl",cat:"Diabetes",uses:"Type 2 diabetes, blood sugar control, PCOS",rx:true,img:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Metformin_500mg_tablets.jpg/320px-Metformin_500mg_tablets.jpg"},
{name:"Glimepiride",generic:"Glimepiride",cat:"Diabetes",uses:"Type 2 diabetes",rx:true,img:""},
{name:"Sitagliptin",generic:"Sitagliptin",cat:"Diabetes",uses:"Type 2 diabetes",rx:true,img:""},
{name:"Voglibose",generic:"Voglibose",cat:"Diabetes",uses:"Type 2 diabetes, post-meal blood sugar",rx:true,img:""},
{name:"Dapagliflozin",generic:"Dapagliflozin",cat:"Diabetes",uses:"Type 2 diabetes, heart failure",rx:true,img:""},
{name:"Empagliflozin",generic:"Empagliflozin",cat:"Diabetes",uses:"Type 2 diabetes, cardiovascular protection",rx:true,img:""},
{name:"Glipizide",generic:"Glipizide",cat:"Diabetes",uses:"Type 2 diabetes",rx:true,img:""},
{name:"Pioglitazone",generic:"Pioglitazone",cat:"Diabetes",uses:"Type 2 diabetes, insulin resistance",rx:true,img:""},
{name:"Amlodipine",generic:"Amlodipine Besylate",cat:"Heart & BP",uses:"High blood pressure, angina",rx:true,img:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Amlodipine_5mg_tablets.jpg/320px-Amlodipine_5mg_tablets.jpg"},
{name:"Atenolol",generic:"Atenolol",cat:"Heart & BP",uses:"High blood pressure, angina, heart failure",rx:true,img:""},
{name:"Losartan",generic:"Losartan Potassium",cat:"Heart & BP",uses:"High blood pressure, kidney protection",rx:true,img:""},
{name:"Telmisartan",generic:"Telmisartan",cat:"Heart & BP",uses:"Hypertension, cardiovascular risk",rx:true,img:""},
{name:"Atorvastatin",generic:"Atorvastatin Calcium",cat:"Heart & BP",uses:"High cholesterol, heart disease prevention",rx:true,img:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Atorvastatin_10mg_tablets.jpg/320px-Atorvastatin_10mg_tablets.jpg"},
{name:"Rosuvastatin",generic:"Rosuvastatin",cat:"Heart & BP",uses:"High cholesterol, triglycerides",rx:true,img:""},
{name:"Clopidogrel",generic:"Clopidogrel",cat:"Heart & BP",uses:"Blood clot prevention, heart attack, stroke",rx:true,img:""},
{name:"Aspirin 75mg",generic:"Acetylsalicylic Acid",cat:"Heart & BP",uses:"Heart attack prevention, blood thinning",rx:false,img:""},
{name:"Metoprolol",generic:"Metoprolol Succinate",cat:"Heart & BP",uses:"High BP, heart failure, angina",rx:true,img:""},
{name:"Ramipril",generic:"Ramipril",cat:"Heart & BP",uses:"High BP, heart failure, kidney protection",rx:true,img:""},
{name:"Vitamin C",generic:"Ascorbic Acid",cat:"Vitamins",uses:"Immunity boost, antioxidant, skin health",rx:false,img:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Vitamin_C_tablets.jpg/320px-Vitamin_C_tablets.jpg"},
{name:"Vitamin D3",generic:"Cholecalciferol",cat:"Vitamins",uses:"Bone health, immunity, calcium absorption",rx:false,img:""},
{name:"Vitamin B12",generic:"Cyanocobalamin",cat:"Vitamins",uses:"Nerve health, anemia, energy, brain function",rx:false,img:""},
{name:"Zinc Tablets",generic:"Zinc Sulphate",cat:"Vitamins",uses:"Immunity, wound healing, cold prevention",rx:false,img:""},
{name:"Iron + Folic Acid",generic:"Ferrous Sulphate + Folic Acid",cat:"Vitamins",uses:"Anemia, pregnancy, iron deficiency",rx:false,img:""},
{name:"Calcium + D3",generic:"Calcium Carbonate + Vitamin D3",cat:"Vitamins",uses:"Bone strength, osteoporosis prevention",rx:false,img:""},
{name:"Multivitamin",generic:"Multivitamin Complex",cat:"Vitamins",uses:"General health, nutritional deficiency",rx:false,img:""},
{name:"Omega-3",generic:"Fish Oil",cat:"Vitamins",uses:"Heart health, brain function, inflammation",rx:false,img:""},
{name:"Vitamin B Complex",generic:"B1+B2+B3+B6+B12",cat:"Vitamins",uses:"Nerve health, energy, metabolism",rx:false,img:""},
{name:"Folic Acid",generic:"Folate",cat:"Vitamins",uses:"Pregnancy, anemia, neural tube defect prevention",rx:false,img:""},
{name:"Clotrimazole Cream",generic:"Clotrimazole",cat:"Skin",uses:"Fungal infections, ringworm, athlete foot",rx:false,img:""},
{name:"Betamethasone Cream",generic:"Betamethasone",cat:"Skin",uses:"Eczema, psoriasis, skin inflammation",rx:true,img:""},
{name:"Mupirocin Ointment",generic:"Mupirocin",cat:"Skin",uses:"Bacterial skin infections, impetigo",rx:true,img:""},
{name:"Calamine Lotion",generic:"Calamine",cat:"Skin",uses:"Itching, rashes, sunburn, chickenpox",rx:false,img:""},
{name:"Hydrocortisone Cream",generic:"Hydrocortisone",cat:"Skin",uses:"Mild eczema, insect bites, contact dermatitis",rx:false,img:""},
{name:"Tretinoin Cream",generic:"Tretinoin",cat:"Skin",uses:"Acne, wrinkles, skin texture",rx:true,img:""},
{name:"Ketoconazole Cream",generic:"Ketoconazole",cat:"Skin",uses:"Fungal skin infections, dandruff",rx:false,img:""},
{name:"Terbinafine Cream",generic:"Terbinafine",cat:"Skin",uses:"Fungal infections, ringworm, nail fungus",rx:false,img:""},
{name:"Salbutamol Inhaler",generic:"Salbutamol",cat:"Respiratory",uses:"Asthma, COPD, bronchospasm",rx:true,img:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Salbutamol_inhaler.jpg/320px-Salbutamol_inhaler.jpg"},
{name:"Budesonide Inhaler",generic:"Budesonide",cat:"Respiratory",uses:"Asthma prevention, COPD",rx:true,img:""},
{name:"Ambroxol",generic:"Ambroxol HCl",cat:"Respiratory",uses:"Cough with mucus, bronchitis, chest congestion",rx:false,img:""},
{name:"Dextromethorphan",generic:"Dextromethorphan",cat:"Respiratory",uses:"Dry cough suppression",rx:false,img:""},
{name:"Bromhexine",generic:"Bromhexine HCl",cat:"Respiratory",uses:"Productive cough, mucus thinning",rx:false,img:""},
{name:"Theophylline",generic:"Theophylline",cat:"Respiratory",uses:"Asthma, COPD, bronchospasm",rx:true,img:""},
{name:"Ciprofloxacin Eye Drops",generic:"Ciprofloxacin",cat:"Eye & Ear",uses:"Bacterial eye infections, conjunctivitis",rx:true,img:""},
{name:"Artificial Tears",generic:"Carboxymethylcellulose",cat:"Eye & Ear",uses:"Dry eyes, eye irritation",rx:false,img:""},
{name:"Otrivin Nasal Drops",generic:"Xylometazoline",cat:"Eye & Ear",uses:"Nasal congestion, blocked nose",rx:false,img:""},
{name:"Tobramycin Eye Drops",generic:"Tobramycin",cat:"Eye & Ear",uses:"Eye infections, bacterial conjunctivitis",rx:true,img:""},
{name:"Alprazolam",generic:"Alprazolam",cat:"Mental Health",uses:"Anxiety, panic disorder",rx:true,img:""},
{name:"Sertraline",generic:"Sertraline HCl",cat:"Mental Health",uses:"Depression, anxiety, OCD, PTSD",rx:true,img:""},
{name:"Escitalopram",generic:"Escitalopram",cat:"Mental Health",uses:"Depression, generalized anxiety disorder",rx:true,img:""},
{name:"Melatonin",generic:"Melatonin",cat:"Mental Health",uses:"Sleep disorders, jet lag, insomnia",rx:false,img:""},
{name:"Clonazepam",generic:"Clonazepam",cat:"Mental Health",uses:"Anxiety, seizures, panic disorder",rx:true,img:""},
{name:"Fluoxetine",generic:"Fluoxetine HCl",cat:"Mental Health",uses:"Depression, OCD, bulimia, panic disorder",rx:true,img:""},
{name:"Levothyroxine",generic:"Levothyroxine Sodium",cat:"Thyroid",uses:"Hypothyroidism, thyroid hormone replacement",rx:true,img:""},
{name:"Carbimazole",generic:"Carbimazole",cat:"Thyroid",uses:"Hyperthyroidism, Graves disease",rx:true,img:""},
{name:"Betadine Solution",generic:"Povidone Iodine",cat:"First Aid",uses:"Wound cleaning, antiseptic",rx:false,img:""},
{name:"Savlon Antiseptic",generic:"Chlorhexidine + Cetrimide",cat:"First Aid",uses:"Wound cleaning, antiseptic cream",rx:false,img:""},
{name:"Bandage Crepe",generic:"Elastic Bandage",cat:"First Aid",uses:"Wound dressing, sprains, support",rx:false,img:""},
{name:"Hydrogen Peroxide",generic:"Hydrogen Peroxide 3%",cat:"First Aid",uses:"Wound cleaning, antiseptic",rx:false,img:""}
];

const CAT_COLORS={
  "Pain & Fever":"background:#fef3c7;color:#92400e",
  "Antibiotics":"background:#fce7f3;color:#9d174d",
  "Digestive":"background:#d1fae5;color:#065f46",
  "Allergy & Cold":"background:#e0f2fe;color:#075985",
  "Diabetes":"background:#ede9fe;color:#4c1d95",
  "Heart & BP":"background:#fee2e2;color:#991b1b",
  "Vitamins":"background:#f0fdf4;color:#14532d",
  "Skin":"background:#fdf4ff;color:#6b21a8",
  "Respiratory":"background:#ecfeff;color:#164e63",
  "Eye & Ear":"background:#fff7ed;color:#9a3412",
  "Mental Health":"background:#f5f3ff;color:#4c1d95",
  "Thyroid":"background:#fef9c3;color:#713f12",
  "First Aid":"background:#f0fdf4;color:#166534"
};

const CAT_ICONS={
  "Pain & Fever":"fa-head-side-cough","Antibiotics":"fa-bacteria",
  "Digestive":"fa-stomach","Allergy & Cold":"fa-wind",
  "Diabetes":"fa-syringe","Heart & BP":"fa-heartbeat",
  "Vitamins":"fa-apple-alt","Skin":"fa-hand-sparkles",
  "Respiratory":"fa-lungs","Eye & Ear":"fa-eye",
  "Mental Health":"fa-brain","Thyroid":"fa-vial","First Aid":"fa-kit-medical"
};

// Category gradient backgrounds for placeholder
const CAT_BG={
  "Pain & Fever":"linear-gradient(135deg,#fef3c7,#fde68a)",
  "Antibiotics":"linear-gradient(135deg,#fce7f3,#fbcfe8)",
  "Digestive":"linear-gradient(135deg,#d1fae5,#a7f3d0)",
  "Allergy & Cold":"linear-gradient(135deg,#e0f2fe,#bae6fd)",
  "Diabetes":"linear-gradient(135deg,#ede9fe,#ddd6fe)",
  "Heart & BP":"linear-gradient(135deg,#fee2e2,#fecaca)",
  "Vitamins":"linear-gradient(135deg,#f0fdf4,#dcfce7)",
  "Skin":"linear-gradient(135deg,#fdf4ff,#f5d0fe)",
  "Respiratory":"linear-gradient(135deg,#ecfeff,#cffafe)",
  "Eye & Ear":"linear-gradient(135deg,#fff7ed,#fed7aa)",
  "Mental Health":"linear-gradient(135deg,#f5f3ff,#ede9fe)",
  "Thyroid":"linear-gradient(135deg,#fef9c3,#fef08a)",
  "First Aid":"linear-gradient(135deg,#f0fdf4,#dcfce7)"
};

const CATEGORIES=["All",...new Set(MEDICINES.map(m=>m.cat))];
let activeCategory="All";
let searchQuery="";

function renderChips(){
  document.getElementById("categoryChips").innerHTML=CATEGORIES.map(c=>
    `<button class="chip ${c===activeCategory?"active":""}" onclick="setCategory('${c}')">${c}</button>`
  ).join("");
}

function setCategory(cat){activeCategory=cat;renderChips();renderResults();}
function onSearch(val){searchQuery=val.trim().toLowerCase();renderResults();}

function renderResults(){
  let list=MEDICINES;
  if(activeCategory!=="All")list=list.filter(m=>m.cat===activeCategory);
  if(searchQuery)list=list.filter(m=>
    m.name.toLowerCase().includes(searchQuery)||
    m.generic.toLowerCase().includes(searchQuery)||
    m.uses.toLowerCase().includes(searchQuery)
  );
  document.getElementById("resultsCount").textContent=`Showing ${list.length} medicine${list.length!==1?"s":""}`;
  const el=document.getElementById("medResults");
  if(!list.length){
    el.innerHTML='<div style="text-align:center;padding:3rem;color:#94a3b8;"><i class="fas fa-search" style="font-size:2.5rem;opacity:0.3;display:block;margin-bottom:1rem;"></i>No medicines found</div>';
    return;
  }
  el.innerHTML='<div class="med-grid">'+list.map(m=>{
    const col=CAT_COLORS[m.cat]||"background:#f1f5f9;color:#475569";
    const icon=CAT_ICONS[m.cat]||"fa-pills";
    const bg=CAT_BG[m.cat]||"linear-gradient(135deg,#f0f9ff,#e0f2fe)";
    const apolloUrl=`https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(m.name)}`;
    const mgUrl=`https://www.1mg.com/search/all?name=${encodeURIComponent(m.name)}`;
    const imgHtml=m.img
      ? `<img src="${m.img}" alt="${m.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML=getPlaceholder('${icon}','${bg}')">`
      : getPlaceholder(icon,bg,m.cat);
    return `<div class="med-card">
      <div class="med-img-wrap" style="background:${bg}">${imgHtml}</div>
      <div class="med-body">
        <div class="med-name">${m.name}${m.rx?'<span class="rx-badge">Rx</span>':""}</div>
        <div class="med-generic">${m.generic}</div>
        <span class="cat-badge" style="${col}">${m.cat}</span>
        <div class="med-uses">${m.uses}</div>
        <div class="med-actions">
          <a href="${apolloUrl}" target="_blank" class="btn-apollo"><i class="fas fa-external-link-alt"></i> Apollo</a>
          <a href="${mgUrl}" target="_blank" class="btn-1mg"><i class="fas fa-external-link-alt"></i> 1mg</a>
        </div>
      </div>
    </div>`;
  }).join("")+"</div>";
}

const CAT_IMAGES={
  "Pain & Fever":"https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
  "Antibiotics":"https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=80",
  "Digestive":"https://images.unsplash.com/photo-1550572017-edd951b55104?w=400&q=80",
  "Allergy & Cold":"https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&q=80",
  "Diabetes":"https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&q=80",
  "Heart & BP":"https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&q=80",
  "Vitamins":"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80",
  "Skin":"https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80",
  "Respiratory":"https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
  "Eye & Ear":"https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80",
  "Mental Health":"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80",
  "Thyroid":"https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&q=80",
  "First Aid":"https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&q=80"
};

function getPlaceholder(icon,bg,cat){
  const catImg=CAT_IMAGES[cat];
  if(catImg)return `<img src="${catImg}" alt="${cat}" style="width:100%;height:100%;object-fit:cover;opacity:0.85;" onerror="this.parentElement.innerHTML='<div style=display:flex;align-items:center;justify-content:center;height:100%;background:'+encodeURIComponent(bg)+'><i class=fas ${icon} style=font-size:2.5rem;color:rgba(0,0,0,0.2);></i></div>'">`;
  return `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:${bg}"><i class="fas ${icon}" style="font-size:2.5rem;color:rgba(0,0,0,0.2);"></i></div>`;
}

renderChips();
renderResults();

